import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { test as base } from "@playwright/test";

const repoRoot = resolve(__dirname, "../..");
const coverageDirectory = join(repoRoot, "coverage", "e2e", "raw");

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);

    const coverage = await page.coverage.stopJSCoverage();
    await mkdir(coverageDirectory, { recursive: true });
    await writeFile(
      join(
        coverageDirectory,
        `${testInfo.workerIndex}-${testInfo.testId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`,
      ),
      JSON.stringify(coverage),
    );
  },
});

export { expect } from "@playwright/test";
