import { describe, expect, it } from "vitest";

// ArchUnitTS checks for a global `expect` at import time; the suite runs with Vitest globals off.
Object.assign(globalThis, { expect });
const { projectFiles } = await import("archunit");

const TSCONFIG = "tsconfig.app.json";

// Direct `fetch(` call sites that predate the planned central API client; this list may only shrink.
const fetchAllowlist = ["api/client.ts", "utils/fetchRetry.ts"];

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

  // V52kl download COMPLETENESS (T56vw): a data-fetch site inside a component ⇒ the same file
  // mounts a DownloadDataButton, so ∄ a rendered payload the user cannot obtain as JSON. The
  // universe is mechanical, ⊥ a hand list: a `/flask/` endpoint literal, the generic-call syntax
  // getCachedOrFetch[<(], or a fetch[A-Z]* wrapper (imports count — util wrappers live outside
  // src/components by the layering rules and their component consumer carries the button).
  const hasDataFetchSite = (content: string) => /\/flask\/|getCachedOrFetch[<(]|\bfetch[A-Z]/.test(content);

  // Escape hatch (V52kl: "control-plane endpoints … excluded in the scan"): components whose
  // fetch response configures or polls rather than paints a dataset for the user. Every entry
  // is a permanent, reason-documented exception — new ones need a spec decision, not a patch.
  const downloadScanExempt: Record<string, string> = {
    "src/components/setup/FunctionList.tsx":
      "control plane: function registration catalog + job-collection counts (refresh/create flow)",
    "src/components/sampling/GridSearchSampling.tsx":
      "sampling-create POST /flask/sampling/grid — registers a job collection (job-CRUD; response holds no analyzable dataset)",
    "src/components/sampling/LHSSampling.tsx":
      "sampling-create POST /flask/sampling/lhs — registers a job collection (job-CRUD; response holds no analyzable dataset)",
  };

  it("every component data-fetch site mounts a DownloadDataButton (V52kl)", async () => {
    const violations = await projectFiles(TSCONFIG)
      .inFolder("src/components/**")
      .should()
      .adhereTo(
        file =>
          !isProductionSource(file.path) ||
          Object.keys(downloadScanExempt).some(exempt => file.path.endsWith(exempt)) ||
          !hasDataFetchSite(file.content) ||
          file.content.includes("DownloadDataButton"),
        "a data-fetch site must mount a DownloadDataButton (V51ij semantics, V52kl completeness)",
      )
      .check();
    expect(violations).toEqual([]);
  });

  // Guards against a vacuous pass: all 8 current plots satisfy the law, so the scan alone can
  // only ever prove GREEN. These cases pin that the predicate itself still discriminates — a
  // fetch-site file without a button IS a violation, and real call-site syntax IS matched.
  it("the download-completeness predicate discriminates (guards against vacuous passes)", () => {
    expect(hasDataFetchSite("const d = await getCachedOrFetch<PlotType>(url, body, () => requestJson<PlotType>(u));")).toBe(true);
    expect(hasDataFetchSite("const d = await getCachedOrFetch(`/flask/dakota/x`, ...);")).toBe(true);
    expect(hasDataFetchSite("import { fetchCorrelationIndices } from '../../utils/correlationIndices';")).toBe(true);
    expect(hasDataFetchSite("requestJson(`/api/v1/jobs`, { method: 'GET' });")).toBe(false);
    expect(hasDataFetchSite("<Box>plain UI</Box>")).toBe(false);

    // the whole-file rule: fetch site WITHOUT a button is flagged, WITH a button passes
    const fileAdheres = (content: string) => !hasDataFetchSite(content) || content.includes("DownloadDataButton");
    expect(fileAdheres("await fetchSomeNewDataView({});")).toBe(false); // planted violation
    expect(fileAdheres("await fetchSomeNewDataView({}); return <DownloadDataButton />;")).toBe(true);
  });
});
