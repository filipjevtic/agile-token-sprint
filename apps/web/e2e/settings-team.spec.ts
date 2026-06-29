import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth.js";

test.describe.serial("team management", () => {
  test("add a team member", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "Team" }).click();
    await page.locator("#memberEmail").fill("teammate@test.com");
    await page.locator("#memberDisplayName").fill("Team Mate");
    await page.getByRole("button", { name: "Add member" }).click();
    await expect(page.getByText("teammate@test.com")).toBeVisible({ timeout: 5000 });
  });

  test("change member role", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "Team" }).click();
    const memberRow = page.locator("li").filter({ hasText: "teammate@test.com" });
    await expect(memberRow).toBeVisible();
    await memberRow.getByLabel("Member role").selectOption("viewer");
    await expect(memberRow.getByLabel("Member role")).toHaveValue("viewer");
  });

  test("remove team member", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "Team" }).click();
    const memberRow = page.locator("li").filter({ hasText: "teammate@test.com" });
    await expect(memberRow).toBeVisible();
    await memberRow.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("teammate@test.com")).not.toBeVisible({ timeout: 5000 });
  });
});
