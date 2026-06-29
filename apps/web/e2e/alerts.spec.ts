import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth.js";

test.describe("budget settings", () => {
  test("budget form loads with inputs", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "Budget", exact: true }).click();
    await expect(page.locator("#tokenBudget")).toBeVisible();
    await expect(page.locator("#costBudget")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save budget" })).toBeVisible();
  });

  test("save budget shows success message", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "Budget", exact: true }).click();
    await page.locator("#tokenBudget").fill("50000");
    await page.locator("#costBudget").fill("10.00");
    await page.getByRole("button", { name: "Save budget" }).click();
    await expect(page.getByText("Budget updated successfully.")).toBeVisible({ timeout: 10000 });
  });
});
