import { type Page, expect } from "@playwright/test";
import { ADMIN } from "./test-users";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill(password);
  await page.getByRole("button", { name: /entrar|iniciar|login/i }).click();
  await page.waitForURL(/\/(dashboard|home|perfil|matches)/, { timeout: 15_000 });
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin-login");
  await page.getByLabel(/usuario|username/i).fill(ADMIN.username);
  await page.getByLabel(/contraseña|password/i).fill(ADMIN.password);
  await page.getByRole("button", { name: /entrar|iniciar|login/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15_000 });
}

export async function getLatestPostmatchUrl(page: Page): Promise<string> {
  await page.goto("/matches");
  const matchLink = page.locator("a[href*='/matches/']").first();
  await expect(matchLink).toBeVisible({ timeout: 10_000 });
  const href = await matchLink.getAttribute("href");
  if (!href) throw new Error("No match link found");
  return href;
}
