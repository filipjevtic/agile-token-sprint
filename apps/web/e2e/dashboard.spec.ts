import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth.js";

test("dashboard loads and shows project content", async ({ page }) => {
  await loginAs(page);
  await page.goto("/");
  await expect(page.getByText("Dashboard").first()).toBeVisible();
  await expect(
    page.getByText("Tokens").first().or(page.getByText("No sprint data"))
  ).toBeVisible({ timeout: 10000 });
});
