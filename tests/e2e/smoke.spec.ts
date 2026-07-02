import { test, expect } from "@playwright/test";

/**
 * Toolchain smoke test (§T8). Asserts the @playwright/test runner is wired and
 * the e2e config resolves a baseURL. Does not exercise the app stack; the real
 * SuMo read-only behavioral + pixel suite lives in sumo-readonly.spec.ts (§T11).
 */
test("playwright runner is configured with a baseURL", async ({ baseURL }) => {
  expect(baseURL).toBeTruthy();
});
