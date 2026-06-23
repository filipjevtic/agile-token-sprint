import { test, expect } from "@playwright/test";

test.describe("@visual visual regression", () => {
  test("dashboard page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page).toHaveScreenshot("dashboard.png", { maxDiffPixels: 100 });
  });

  test("forecast page", async ({ page }) => {
    await page.goto("/forecast");
    await expect(page.getByRole("heading", { name: "Forecast & Capacity" })).toBeVisible();
    await expect(page).toHaveScreenshot("forecast.png", { maxDiffPixels: 100 });
  });

  test("integrations page", async ({ page }) => {
    await page.goto("/integrations");
    await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();
    await expect(page).toHaveScreenshot("integrations.png", { maxDiffPixels: 100 });
  });
});
