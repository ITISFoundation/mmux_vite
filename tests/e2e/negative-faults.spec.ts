import { expect, test } from "./coverage";
import { resetPersistence, setDeployment, setFault, VIEW_TIMEOUT } from "./helpers";

test("function-list backend failure shows recovery feedback", async ({ page, baseURL }) => {
  const url = baseURL!;
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await setDeployment(page.request, url, "SUMO", "READ-ONLY");
  await setFault(page.request, url, "list_functions");
  await resetPersistence(page.request, url);

  try {
    await page.goto(url);
    await expect(page.getByText("Error fetching functions from the server.")).toBeVisible({ timeout: VIEW_TIMEOUT });
    expect(pageErrors).toEqual([]);
  } finally {
    await setFault(page.request, url, "list_functions", false);
  }
});
