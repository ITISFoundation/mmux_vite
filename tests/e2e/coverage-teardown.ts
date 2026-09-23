import { mkdir, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import v8ToIstanbul from "v8-to-istanbul";
import { createCoverageMap } from "istanbul-lib-coverage";
import { createContext } from "istanbul-lib-report";
import reports from "istanbul-reports";

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
      functions: Parameters<ReturnType<typeof v8ToIstanbul>["applyCoverage"]>[0];
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

  await mkdir(reportDirectory, { recursive: true });
  const context = createContext({
    dir: reportDirectory,
    coverageMap,
    projectRoot: repoRoot,
  });
  reports.create("cobertura", {}).execute(context);
}
