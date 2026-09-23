import { describe, expect, it } from "vitest";

// ArchUnitTS checks for a global `expect` at import time; the suite runs with Vitest globals off.
Object.assign(globalThis, { expect });
const { projectFiles } = await import("archunit");

const TSCONFIG = "tsconfig.app.json";

// Direct `fetch(` call sites that predate the planned central API client; this list may only shrink.
const fetchAllowlist = [
  "api/client.ts",
  "components/plots/Curves1DPlot.tsx",
  "components/plots/IsoSurface3DPlot.tsx",
  "components/plots/SuMoValidation.tsx",
  "components/plots/Surface2DPlot.tsx",
  "context/PersistenceContext.tsx",
  "utils/fetchRetry.ts",
  "utils/functionUtils.ts",
];

const isProductionSource = (path: string) =>
  !/\.test\.tsx?$/.test(path) && !path.includes("/src/test/") && !path.includes("osparc-api-ts-client");

describe("architecture", { timeout: 60_000 }, () => {
  it("has no import cycles in application code", async () => {
    const violations = await projectFiles(TSCONFIG)
      .inFolder("src/{components,context,utils,views}/**")
      .should()
      .haveNoCycles()
      .check();
    expect(violations).toEqual([]);
  });

  // utils → context is allowed: utils consume the shared context types (context/types.d.ts, *ContextType).
  it.each([
    ["src/utils/**", "src/components/**"],
    ["src/utils/**", "src/views/**"],
    ["src/context/**", "src/components/**"],
    ["src/context/**", "src/views/**"],
    ["src/components/**", "src/views/**"],
  ])("%s does not depend on %s", async (from, to) => {
    const violations = await projectFiles(TSCONFIG).inFolder(from).shouldNot().dependOnFiles().inFolder(to).check();
    expect(violations).toEqual([]);
  });

  it("detects a real layering violation (guards against vacuous passes)", async () => {
    const violations = await projectFiles(TSCONFIG)
      .inFolder("src/components/**")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/context/**")
      .check();
    expect(violations.length).toBeGreaterThan(0);
  });

  it("adds no new direct fetch call sites outside the allowlist", async () => {
    const violations = await projectFiles(TSCONFIG)
      .inFolder("src/**")
      .should()
      .adhereTo(
        file =>
          !isProductionSource(file.path) ||
          fetchAllowlist.some(allowed => file.path.endsWith(`src/${allowed}`)) ||
          !/(^|[^\w.])fetch\(/.test(file.content),
        "only allow-listed modules may call fetch() directly",
      )
      .check();
    expect(violations).toEqual([]);
  });
});
