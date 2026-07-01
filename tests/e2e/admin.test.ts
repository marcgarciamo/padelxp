import { test, expect, type Page } from "@playwright/test";
import { ADMIN } from "./helpers/test-users";

async function loginAsAdmin(page: Page) {
  await page.goto("/admin-login");
  await page.locator("input[autocomplete='username']").fill(ADMIN.username);
  await page.locator("input[autocomplete='current-password']").fill(ADMIN.password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20_000 });
}

test.describe("Admin panel", () => {
  test.describe.configure({ mode: "serial" });

  let adminPage: Page;

  test.beforeAll(async ({ browser }) => {
    adminPage = await browser.newPage();
    await loginAsAdmin(adminPage);
  });

  test.afterAll(async () => {
    await adminPage.close();
  });

  test("admin login works and redirects to dashboard", async () => {
    await expect(adminPage).toHaveURL(/\/admin\/dashboard/);
    await expect(adminPage.locator("body")).toBeVisible();
  });

  test("admin dashboard shows key sections", async () => {
    await adminPage.goto("/admin/dashboard");
    await adminPage.waitForLoadState("networkidle");
    const text = await adminPage.locator("body").textContent();
    expect(text?.length).toBeGreaterThan(100);
  });

  test("admin users list is accessible", async () => {
    await adminPage.goto("/admin/users");
    await expect(adminPage).toHaveURL(/\/admin\/users/);
    await adminPage.waitForLoadState("networkidle");
    await expect(adminPage.locator("body")).toBeVisible();
  });

  test("admin matches list is accessible", async () => {
    await adminPage.goto("/admin/matches");
    await expect(adminPage).toHaveURL(/\/admin\/matches/);
    await adminPage.waitForLoadState("networkidle");
    await expect(adminPage.locator("body")).toBeVisible();
  });

  test("unauthenticated access to admin redirects to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin-login/);
  });
});
