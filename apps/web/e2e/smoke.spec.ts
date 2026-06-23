import { test, expect } from "@playwright/test";

test.describe("smoke tests", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Agile Token Sprint/);
    await expect(page.getByText("Dashboard").first()).toBeVisible();
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Forecast" }).click();
    await expect(page.getByRole("heading", { name: "Forecast & Capacity" })).toBeVisible();

    await page.getByRole("link", { name: "Integrations" }).click();
    await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();

    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("server health endpoint is up", async ({ request }) => {
    const response = await request.get("http://localhost:3000/health");
    expect(response.ok()).toBeTruthy();
  });
});
