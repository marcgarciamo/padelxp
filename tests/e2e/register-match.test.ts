import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { TEST_USERS } from "./helpers/test-users";

test.describe("Register Match flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
  });

  test("form is accessible after login", async ({ page }) => {
    await page.goto("/register-match");
    await expect(page.getByText("Nuevo partido")).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/register-match");
    await page.getByRole("button", { name: /guardar partido/i }).click();
    // venue is required
    await expect(page.getByText(/mínimo 2 caracteres/i)).toBeVisible();
  });

  test("can search and select a partner", async ({ page }) => {
    await page.goto("/register-match");
    const partnerInput = page.getByPlaceholder("Buscar compañero...");
    await partnerInput.fill(TEST_USERS.player2.name.split(" ")[0]!);
    await expect(page.getByText(TEST_USERS.player2.name)).toBeVisible({ timeout: 5_000 });
    await page.getByText(TEST_USERS.player2.name).click();
    // picker collapses and shows selected player
    await expect(page.getByText(TEST_USERS.player2.name)).toBeVisible();
  });

  test("successful match registration redirects to postmatch", async ({ page }) => {
    await page.goto("/register-match");

    // Fill venue
    await page.getByLabel(/club \/ pista/i).fill("Club Test");

    // Select partner
    const partnerInput = page.getByPlaceholder("Buscar compañero...");
    await partnerInput.fill(TEST_USERS.player2.name.split(" ")[0]!);
    await page.getByText(TEST_USERS.player2.name).first().click();

    // Select opponent 1
    const opp1Input = page.getByPlaceholder("Buscar rival 1...");
    await opp1Input.fill(TEST_USERS.player3.name.split(" ")[0]!);
    await page.getByText(TEST_USERS.player3.name).first().click();

    // Select opponent 2
    const opp2Input = page.getByPlaceholder("Buscar rival 2...");
    await opp2Input.fill(TEST_USERS.player4.name.split(" ")[0]!);
    await page.getByText(TEST_USERS.player4.name).first().click();

    // Default set 6-4 is valid — submit
    await page.getByRole("button", { name: /guardar partido/i }).click();

    // Should redirect to postmatch
    await expect(page).toHaveURL(/\/postmatch\//, { timeout: 20_000 });
  });
});
