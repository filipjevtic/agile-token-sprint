import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth.js";

test.describe.serial("API key management", () => {
  test("create and list API key", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "API Keys" }).click();
    await page.locator("#keyNote").fill("e2e-revoke-key");
    await page.getByRole("button", { name: "Create key" }).click();
    await expect(page.getByText("bw_sk_").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("e2e-revoke-key")).toBeVisible();
  });

  test("revoke API key shows revoked status", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "API Keys" }).click();
    await expect(page.getByText("e2e-revoke-key")).toBeVisible();
    const keyRow = page.locator("li").filter({ hasText: "e2e-revoke-key" });
    await keyRow.getByRole("button").click();
    await expect(page.getByText("revoked")).toBeVisible({ timeout: 5000 });
  });
});
