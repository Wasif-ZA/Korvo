import { expect, test } from "@playwright/test";

test.describe("Stripe checkout flow", () => {
  test("pricing page renders checkout CTA", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
    await expect(page.getByRole("button", { name: /start pro/i })).toBeVisible();
  });
});
