import fs from "node:fs";
import path from "node:path";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

/**
 * V48fl (root SPEC §V): with CI retries=1, a retry must never SILENTLY green a
 * flake. This reporter turns the `flaky` outcome (failed, then passed on the
 * retry) into visible YELLOW:
 *
 *  * GitHub: a `::warning` workflow command → yellow annotation on the run
 *    summary (emitted only when CI=true, so local `list` output stays clean);
 *  * HTML report: an annotation on the test's final result;
 *  * `playwright-report/flake-ledger.json`: per-run ledger of which tests
 *    flaked and how each attempt ended — rides the EXISTING
 *    `playwright-report` artifact upload in ci.yml (⊥ new artifact step).
 *
 * Deterministic failures fail BOTH attempts and stay red: the green gate
 * itself (§V10's zero-counted-pixel contract) is unchanged. A retry exists to
 * CLASSIFY, not to hide (B37kl's "guard that can only pass" disease must not
 * return dressed as auto-retry).
 */

interface FlakeEntry {
  test: string;
  file: string;
  line: number;
  attempts: string[];
}

export default class FlakyWarningReporter implements Reporter {
  private readonly flakes: FlakeEntry[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    // outcome() only stabilizes once ALL attempts have completed: on a failed
    // attempt with a retry still pending, recording here would double-count,
    // so we key off the final outcome and the final-attempt call records it.
    let outcome: string;
    try {
      outcome = test.outcome();
    } catch {
      return;
    }
    if (outcome !== "flaky") {
      return;
    }
    const attempts = test.results.map((r) => r.status ?? "unknown");
    // De-dup: outcome() may be queried on earlier attempts too — record once.
    const key = test.id;
    if (this.flakes.some((f) => (f as FlakeEntry & { key?: string }).key === key)) {
      return;
    }
    const label = test.titlePath().slice(1).join(" › ");
    const entry: FlakeEntry & { key: string } = {
      key,
      test: label,
      file: test.location.file,
      line: test.location.line,
      attempts,
    };
    this.flakes.push(entry);
    result.annotations.push({
      type: "FLAKY (V48fl): passed on retry — investigate, ⊥ ignore",
      description: `attempt outcomes: ${attempts.join(", ")}`,
    });
    if (process.env.CI) {
      process.stdout.write(
        `::warning title=E2E flaky (V48fl)::${test.location.file}:${test.location.line} ` +
          `${label} — attempts: ${attempts.join(", ")}; job stays GREEN, flake is on the ledger\n`,
      );
    }
  }

  onEnd(): void {
    // Always write on CI (an empty ledger is evidence of a flake-free run);
    // locally only when something actually flaked (⊥ stray files for devs).
    if (!process.env.CI && this.flakes.length === 0) {
      return;
    }
    const dir = "playwright-report";
    fs.mkdirSync(dir, { recursive: true });
    const ledger = {
      runAt: new Date().toISOString(),
      flakeCount: this.flakes.length,
      flakes: this.flakes.map(({ key: _key, ...rest }) => rest),
    };
    fs.writeFileSync(path.join(dir, "flake-ledger.json"), JSON.stringify(ledger, null, 2) + "\n");
  }
}
