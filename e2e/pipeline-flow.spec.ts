import { expect, test } from "@playwright/test";

test.describe("Pipeline flow", () => {
  test("landing shows pipeline section and execution labels", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /see how it works/i }).click();
    await expect(page.locator("#how-it-works")).toBeVisible();
    await expect(page.getByText("Execution Pipeline")).toBeVisible();
    await expect(page.getByText("Pipeline Output")).toBeVisible();
  });
});
