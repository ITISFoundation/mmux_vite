import { test, expect } from "@playwright/test";
import { VIEW_TIMEOUT, resetPersistence, setDeployment } from "./helpers";

/**
 * Regression coverage for B18/V24 (node/SPEC §T18): a real oSPARC function
 * whose input variable names contain underscores (e.g. `sigma_blood`) must
 * survive `normalizePayloadToCamelCase` unchanged, because those names are
 * opaque identifiers oSPARC round-trips verbatim in every downstream request
 * (validation / plots / UQ propagation) — not API field names to camelCase.
 *
 * The shared `tests/e2e/mock_osparc` fixture intentionally exposes exactly one
 * function with underscore-free variable names (x1..x4), so its pixel-snapshot
 * baselines (sumo/uq/moga-readonly specs) can't exercise this bug class without
 * being rewritten. Rather than mutate that shared fixture (and its committed
 * baselines), this spec intercepts `list_functions` at the network layer with a
 * fabricated response and asserts on rendered DOM state, so it needs no new
 * pixel baseline and can't affect the other specs' snapshots.
 */

const MOCK_FUNCTION_UID = "func-case-preserve-e2e";

const MOCK_FUNCTION = {
  uid: MOCK_FUNCTION_UID,
  title: "Case Preservation E2E Function",
  description: "Synthetic function exercising underscore-bearing variable names.",
  functionClass: "PROJECT",
  projectId: "11111111-1111-1111-1111-111111111111",
  defaultInputs: { sigma_blood: 0.7, sigma_conn: 0.35 },
  inputSchema: {
    schemaClass: "application/schema+json",
    schemaContent: {
      type: "object",
      properties: {
        sigma_blood: { type: "number" },
        sigma_conn: { type: "number" },
      },
      required: ["sigma_blood", "sigma_conn"],
    },
  },
  outputSchema: {
    schemaClass: "application/schema+json",
    schemaContent: {
      type: "object",
      properties: { shannon_5: { type: "number" } },
      required: ["shannon_5"],
    },
  },
};

test("preserves underscore variable-name identifiers through function selection (B18, V24)", async ({
  page,
  baseURL,
}) => {
  const url = baseURL!;

  // UQ mode renders a per-variable distribution selector keyed by the raw
  // variable name (InputVariableDist.tsx), which is the sharpest DOM signal:
  // it only exists if the FE preserved the exact identifier casing.
  await setDeployment(page.request, url, "UQ", "READ-ONLY");
  await resetPersistence(page.request, url);

  await page.route("**/flask/osparc/list_functions*", async route => {
    await route.fulfill({ json: [MOCK_FUNCTION] });
  });

  await page.goto(url, { timeout: VIEW_TIMEOUT });
  await page.waitForLoadState("networkidle");

  const functionGrid = page.locator('[role="grid"]').first();
  await functionGrid.waitFor({ state: "visible", timeout: VIEW_TIMEOUT });

  const selectButton = page.locator(`[mmux-testid="select-function-btn-${MOCK_FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();

  // If normalizePayloadToCamelCase had corrupted the names, this testid would
  // instead be rendered as `input-var-sigmaBlood-distribution-selector`.
  const sigmaBloodSelector = page.locator('[mmux-testid="input-var-sigma_blood-distribution-selector"]');
  await expect(sigmaBloodSelector).toBeVisible({ timeout: VIEW_TIMEOUT });
  const sigmaConnSelector = page.locator('[mmux-testid="input-var-sigma_conn-distribution-selector"]');
  await expect(sigmaConnSelector).toBeVisible({ timeout: VIEW_TIMEOUT });

  await expect(page.locator('[mmux-testid="input-var-sigmaBlood-distribution-selector"]')).toHaveCount(0);
  await expect(page.locator('[mmux-testid="input-var-sigmaConn-distribution-selector"]')).toHaveCount(0);
});
