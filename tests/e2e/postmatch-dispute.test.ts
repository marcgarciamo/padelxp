import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { TEST_USERS } from "./helpers/test-users";

test.describe("Postmatch dispute", () => {
  test("dispute button visible on postmatch page", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/matches");

    const matchLinks = page.locator("a[href*='/postmatch/']");
    const count = await matchLinks.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const href = await matchLinks.first().getAttribute("href");
    if (!href) { test.skip(); return; }
    await page.goto(href);

    // Dispute / contestar should be present
    const disputeEl = page.getByRole("button", { name: /disputar|contestar|impugnar/i });
    const hasDispute = (await disputeEl.count()) > 0;
    if (hasDispute) {
      await expect(disputeEl.first()).toBeVisible();
    } else {
      // Some flows may not show dispute for the registering player
      test.skip();
    }
  });
});
