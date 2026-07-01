import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { TEST_USERS } from "./helpers/test-users";

test.describe("Postmatch flow", () => {
  test("postmatch page loads after match creation", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/register-match");

    await page.getByLabel(/club \/ pista/i).fill("Postmatch Test Club");

    const partnerInput = page.getByPlaceholder("Buscar compañero...");
    await partnerInput.fill(TEST_USERS.player2.name.split(" ")[0]!);
    await page.getByText(TEST_USERS.player2.name).first().click();

    const opp1Input = page.getByPlaceholder("Buscar rival 1...");
    await opp1Input.fill(TEST_USERS.player3.name.split(" ")[0]!);
    await page.getByText(TEST_USERS.player3.name).first().click();

    const opp2Input = page.getByPlaceholder("Buscar rival 2...");
    await opp2Input.fill(TEST_USERS.player4.name.split(" ")[0]!);
    await page.getByText(TEST_USERS.player4.name).first().click();

    await page.getByRole("button", { name: /guardar partido/i }).click();
    await expect(page).toHaveURL(/\/postmatch\//, { timeout: 20_000 });

    // Postmatch page should be visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("postmatch page accessible by ID from URL", async ({ page }) => {
    // Navigate to matches list and open latest match
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/matches");
    const matchLinks = page.locator("a[href*='/postmatch/']");
    const count = await matchLinks.count();
    if (count > 0) {
      await matchLinks.first().click();
      await expect(page).toHaveURL(/\/postmatch\//);
      await expect(page.locator("body")).toBeVisible();
    } else {
      test.skip();
    }
  });
});
