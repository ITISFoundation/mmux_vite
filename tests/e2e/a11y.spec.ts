import { test, expect } from "./coverage";
import { VIEW_TIMEOUT, expectNoSeriousViolations, failRoute, resetPersistence, setDeployment } from "./helpers";

/**
 * Accessibility smoke checks (root SPEC §T37 / §V42rb): axe-core runs and fails on serious
 * or critical violations. Plotly's canvas/SVG output is third-party and excluded;
 * everything else the app renders is in scope.
 *
 * The SETUP / RESULTS / INSPECT-MODEL scans now run INSIDE the read-only flow specs, on the
 * views those flows already render (root §T47mx): one render per view instead of a second
 * spec driving the same three workflows (SuMo/UQ/MOGA) from scratch, with the scan landing
 * after that view's pixel capture. What stays here is the one state a happy-path flow spec
 * cannot reach — the function-list ERROR view, which needs fault injection (§V41qa).
 */

test("the function-list error state has no serious accessibility violations", async ({ page, baseURL }) => {
  await setDeployment(page.request, baseURL!, "SUMO", "READ-ONLY");
  await resetPersistence(page.request, baseURL!);
  await failRoute(page, "**/flask/osparc/list_functions", { status: 500 });
  await page.goto(baseURL!);
  await expect(page.getByText("Error fetching functions from the server.", { exact: false })).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await expectNoSeriousViolations(page);
});
