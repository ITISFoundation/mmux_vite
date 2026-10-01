import { env } from "node:process";
import { defineConfig, devices } from "@playwright/test";

/**
 * e2e config for the MMUX read-only pixel-snapshot suite (SuMo/UQ/MOGA).
 * Root SPEC §T4,§T8-§T12 / §V10-§V13 ; node/SPEC §T9.
 *
 * Stack (wired in §T10 via webServer): live Flask backend with the in-backend
 * oSPARC test-double (§T9, gated by MMUX_E2E_MOCK_OSPARC) + vite serving the
 * React app with a /flask proxy split. Baselines are committed and regenerated
 * only in the pinned Playwright docker image (§V12); the e2e job installs a
 * JRE so `build:e2e` can regenerate the client before `tsc -b && vite build`.
 */

const BASE_URL = env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8090";
const BACKEND_URL = env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:5000";
const WEB_PORT = new URL(BASE_URL).port || "8090";
const reuseExistingServer = !env.CI;

// Repo root, used to put the test-double on PYTHONPATH and to serve files.
const repoRoot = new URL("..", import.meta.url).pathname;

export default defineConfig({
  testDir: "../tests/e2e",
  // Pixel baselines live next to the repo-level e2e tests, not under node/.
  snapshotPathTemplate: "../tests/e2e/__snapshots__/{testFilePath}/{arg}{ext}",
  fullyParallel: false,
  forbidOnly: !!env.CI,
  retries: 0,
  workers: 1,
  reporter: env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 120_000,
  expect: {
    // STRICT zero tolerance (root SPEC V10): any pixel that moves must move
    // on purpose. The 1% AA/font band we used until #665 swallowed a real UI
    // diff (missing bounds-editor header, root §B B25) — determinism comes
    // from the PINNED docker image (V12), not from tolerance, so ⊥ band here
    // hides rasterization drift: if the pinned image drifts, we regenerate
    // baselines in that same image instead of widening the band.
    // maxDiffPixelRatio 0.0 zeroes the QUOTA of differing pixels. The
    // comparator floor is pinned EXPLICITLY (GH-Copilot #667 note): pixelmatch
    // counts a pixel as different only past a color-distance threshold, and
    // never counts anti-aliased pixels. threshold 0 was MEASURED (2026-10-01):
    // 2/7 baselines fail reproducibly across runs (moga-readonly-inspect-modal,
    // sumo-readonly-inputs — sub-0.2 color drift the AA classifier doesn't
    // absorb), so 0.2 is the strictest stable floor, kept ON PURPOSE.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.0,
      threshold: 0.2,
      animations: "disabled",
      caret: "hide",
      // Plotly/DataGrid can take a few render frames to settle; the default 5s
      // stabilization window is too tight when generating fresh baselines on a
      // slow CI host, so give snapshots a longer window to converge (root §V14).
      timeout: 30_000,
    },
  },
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1920, height: 1080 },
    trace: "on-first-retry",
    screenshot: "on",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
  ],
  // webServer is wired in §T10. Boot scripts set the e2e env (SERVICE_MODE=SUMO,
  // PERMISSIONS=READ-ONLY, DEPLOYMENT_MODE=LOCAL, OSPARC_API_BASE_URL=<test sentinel>,
  // PYTHONPATH+=tests/e2e) so the backend injects the in-backend oSPARC test-double.
  webServer: [
    {
      command: `bash ${repoRoot}tests/e2e/scripts/run-e2e-backend.sh`,
      url: `${BACKEND_URL}/flask/deployment/health`,
      reuseExistingServer,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      // Serve a PRODUCTION build via `vite preview` (not `npm run dev`): production
      // React strips dev-only controlled/uncontrolled warnings and the HMR overlay,
      // matching the deployed Caddy stack the behavioral reference targeted and
      // giving deterministic pixel snapshots (§T10 "vite preview/Caddy", §V12).
      // `build:e2e` regenerates the client when needed; the e2e job installs a
      // JRE before this runs because the pinned Playwright image (§V12) does not.
      command: "npm run build:e2e && npm run preview",
      url: BASE_URL,
      cwd: `${repoRoot}node`,
      env: { E2E_BACKEND_PROXY: BACKEND_URL, E2E_WEB_PORT: WEB_PORT },
      reuseExistingServer,
      timeout: 600_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
