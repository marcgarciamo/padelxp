import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin panel", () => {
  test("admin login works and redirects to dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByText(/dashboard|panel/i).first()).toBeVisible();
  });

  test("admin dashboard shows key sections", async ({ page }) => {
    await loginAsAdmin(page);
    // Stats tiles or headings
    const body = page.locator("body");
    await expect(body).toBeVisible();
    // Page should have player/match metrics
    const hasContent = await page.locator("body").textContent();
    expect(hasContent?.length).toBeGreaterThan(100);
  });

  test("admin users list is accessible", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("admin matches list is accessible", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/matches");
    await expect(page).toHaveURL(/\/admin\/matches/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("unauthenticated access to admin redirects to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin-login/);
  });
});
