import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth.js";

test.describe("dashboard", () => {
  test("shows empty state when no sprints synced", async ({ page }) => {
    await loginAs(page);
    await page.goto("/");
    await expect(page.getByText("Dashboard").first()).toBeVisible();
    await expect(page.getByText("No sprint data")).toBeVisible({ timeout: 10000 });
  });

  test("project selector is visible", async ({ page }) => {
    await loginAs(page);
    await page.goto("/");
    await expect(page.locator("#sprint")).toBeVisible();
  });
});
