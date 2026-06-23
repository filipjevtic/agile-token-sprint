import { test, expect } from "@playwright/test";

test("integration logos and sync forms are visible", async ({ page }) => {
  await page.goto("/integrations");
  await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();

  for (const name of ["GitHub", "Jira", "GitLab"]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }

  // GitHub is expanded by default.
  await expect(page.getByRole("button", { name: "Sync from GitHub" })).toBeVisible();

  // Expand Jira and GitLab accordion sections.
  await page.getByRole("heading", { name: "Jira" }).click();
  await page.getByRole("heading", { name: "GitLab" }).click();

  await expect(page.getByRole("button", { name: "Sync from Jira" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sync from GitLab" })).toBeVisible();
  await expect(page.getByLabel("Jira base URL")).toBeVisible();
  await expect(page.getByLabel("GitLab base URL")).toBeVisible();
  await expect(page.getByLabel("Project key")).toBeVisible();
  await expect(page.getByLabel("Project path (group/project)")).toBeVisible();
});
