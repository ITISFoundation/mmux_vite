import { mkdir, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import v8ToIstanbul from "v8-to-istanbul";
import { createCoverageMap } from "istanbul-lib-coverage";
import { createContext } from "istanbul-lib-report";
import reports from "istanbul-reports";

// Playwright loads global teardown through its CommonJS loader.
const repoRoot = resolve(__dirname, "../..");
const coverageRoot = join(repoRoot, "coverage", "e2e");
const rawCoverageDirectory = join(coverageRoot, "raw");
const reportDirectory = join(coverageRoot, "report");

export default async function globalTeardown() {
  const coverageMap = createCoverageMap({});
  const rawCoverageFiles = await readdir(rawCoverageDirectory).catch(() => []);

  for (const rawCoverageFile of rawCoverageFiles) {
    const coverageEntries = JSON.parse(
      await readFile(join(rawCoverageDirectory, rawCoverageFile), "utf8"),
    ) as Array<{
      url: string;
      source: string;
      functions: Parameters<
        ReturnType<typeof v8ToIstanbul>["applyCoverage"]
      >[0];
    }>;

    for (const entry of coverageEntries) {
      const scriptUrl = new URL(entry.url);
      if (!scriptUrl.pathname.startsWith("/assets/")) continue;

      const scriptPath = join(repoRoot, "node", "dist", scriptUrl.pathname);
      const converter = v8ToIstanbul(scriptPath, 0, { source: entry.source });
      await converter.load();
      converter.applyCoverage(entry.functions);
      coverageMap.merge(converter.toIstanbul());
    }
  }

  // Collected nothing means every raw entry got filtered out (reused dev server
  // serving /src/ URLs, missing sourcemapped build). Writing a header-only
  // cobertura would satisfy the CI `test -s` gate and ship an empty report to
  // Codecov, so fail here instead - before report generation.
  if (coverageMap.files().length === 0) {
    throw new Error(
      `e2e coverage collected zero application files from ` +
        `${rawCoverageFiles.length} raw dump(s): no /assets/ scripts matched - ` +
        "was the frontend served without the sourcemapped production build?",
    );
  }

  await mkdir(reportDirectory, { recursive: true });
  const context = createContext({
    dir: reportDirectory,
    coverageMap,
    projectRoot: repoRoot,
  });
  reports.create("cobertura", {}).execute(context);
}
