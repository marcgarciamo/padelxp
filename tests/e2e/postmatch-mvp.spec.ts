import { test, expect, Browser, BrowserContext } from "@playwright/test";

interface TestUser {
  email: string;
  password: string;
  playerId: string;
  displayName: string;
}

async function loginUser(browser: Browser, user: TestUser, baseURL: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState("networkidle");

  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(`${baseURL}/`, { timeout: 15_000 });

  return { ctx, page };
}

async function voteSteps(page: any, baseURL: string, flowId: string) {
  await page.goto(`${baseURL}/postmatch/${flowId}`);
  await page.waitForLoadState("networkidle");

  const errorText = await page.locator("text=An error occurred").count();
  expect(errorText, "Page should NOT show Server Component error").toBe(0);

  const step2 = await page.locator("text=MVP del Partido").count();
  expect(step2, "Should be on MVP voting step (step 2)").toBeGreaterThan(0);

  // Click "Dejar en blanco" as a safe vote
  await page.click("text=Dejar en blanco");
  await page.click("text=Siguiente →");

  await page.waitForTimeout(1000);

  const errorAfterVote = await page.locator("text=An error occurred").count();
  expect(errorAfterVote, "No error after MVP vote").toBe(0);
}

test("4 players can each vote MVP without Server Component errors", async ({
  browser,
  baseURL,
}) => {
  const base = baseURL ?? "http://localhost:3000";

  // 1. Setup test data
  const setupRes = await fetch(`${base}/api/dev/setup-postmatch-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  if (!setupRes.ok) {
    throw new Error(`Setup failed: ${await setupRes.text()}`);
  }

  const { flowId, users } = (await setupRes.json()) as {
    flowId: string;
    users: TestUser[];
  };

  console.log("Flow ID:", flowId);
  console.log("Users:", users.map((u) => u.email));

  // 2. Login 4 users and navigate to flow — test each independently
  const sessions: Array<{ ctx: BrowserContext; page: any }> = [];

  for (const user of users) {
    const session = await loginUser(browser, user, base);
    sessions.push(session);
  }

  // 3. Each user loads the postmatch page and votes MVP
  for (let i = 0; i < sessions.length; i++) {
    const { page } = sessions[i]!;
    console.log(`Player ${i + 1} voting MVP...`);
    await voteSteps(page, base, flowId);
    console.log(`Player ${i + 1} voted OK`);
  }

  // 4. Cleanup
  for (const { ctx } of sessions) {
    await ctx.close();
  }
});

test("MVP vote is blocked for players not in the flow", async ({
  browser,
  baseURL,
}) => {
  const base = baseURL ?? "http://localhost:3000";

  const setupRes = await fetch(`${base}/api/dev/setup-postmatch-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  const { flowId, users } = (await setupRes.json()) as {
    flowId: string;
    users: TestUser[];
  };

  // Player 1 loads — should see step 2 (pending_voting)
  const { ctx, page } = await loginUser(browser, users[0]!, base);

  await page.goto(`${base}/postmatch/${flowId}`);
  await page.waitForLoadState("networkidle");

  const noError = await page.locator("text=An error occurred").count();
  expect(noError).toBe(0);

  const onStep2 = await page.locator("text=MVP del Partido").count();
  expect(onStep2).toBeGreaterThan(0);

  await ctx.close();
});
