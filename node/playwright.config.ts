import { defineConfig, devices } from "@playwright/test";

/**
 * e2e config for the MMUX SuMo read-only pixel-snapshot suite.
 * Root SPEC §T4,§T8-§T12 / §V10-§V13 ; node/SPEC §T9.
 *
 * Stack (wired in §T10 via webServer): live Flask backend with the in-backend
 * oSPARC test-double (§T9, gated by MMUX_E2E_MOCK_OSPARC) + vite serving the
 * React app with a /flask proxy split. Baselines are committed and regenerated
 * only in the pinned Playwright docker image (§V12).
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8090";
const BACKEND_URL = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:5000";
const WEB_PORT = new URL(BASE_URL).port || "8090";
const reuseExistingServer = !process.env.CI;

// Repo root, used to put the test-double on PYTHONPATH and to serve files.
const repoRoot = new URL("..", import.meta.url).pathname;

export default defineConfig({
  testDir: "../tests/e2e",
  // Pixel baselines live next to the repo-level e2e tests, not under node/.
  snapshotPathTemplate: "../tests/e2e/__snapshots__/{testFilePath}/{arg}{ext}",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 120_000,
  expect: {
    // Deterministic-ish UI; small tolerance for AA/font rasterization differences.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1920, height: 1080 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
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
      // `build:e2e` skips the Java openapi-generator codegen step of `build`: the
      // generated client is already committed, and the pinned Playwright image (§V12)
      // has no JRE.
      command: "npm run build:e2e && npm run preview",
      url: BASE_URL,
      cwd: `${repoRoot}node`,
      env: { E2E_BACKEND_PROXY: BACKEND_URL, E2E_WEB_PORT: WEB_PORT },
      reuseExistingServer,
      timeout: 240_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
