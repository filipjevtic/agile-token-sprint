import { test, expect } from "@playwright/test";

test("forecast updates when target story points change", async ({ page }) => {
  await page.goto("/forecast");
  await expect(page.getByRole("heading", { name: "Forecast & Capacity" })).toBeVisible();

  const targetInput = page.getByLabel("Target story points");
  await targetInput.fill("20");
  await targetInput.blur();

  await expect(page.getByText("Recommended tokens")).toBeVisible();
  await expect(page.getByText("Recommended cost")).toBeVisible();
  await expect(page.getByText("Recommended duration")).toBeVisible();
});
