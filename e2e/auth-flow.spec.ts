import { expect, test } from "@playwright/test";

test.describe("Auth flow", () => {
  test("landing exposes auth entry points and callback route exists", async ({ page, request }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /get started free/i })).toBeVisible();

    const callbackResponse = await request.get("/auth/callback");
    expect([200, 302, 307, 308]).toContain(callbackResponse.status());
  });
});
