export {};

/**
 * Run once to create test users in the target environment:
 *   BASE_URL=https://padelxp.vercel.app bun tests/e2e/helpers/seed-test-users.ts
 * or locally:
 *   bun tests/e2e/helpers/seed-test-users.ts
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const TEST_USERS = [
  { email: "test_player1@padelxp.test", password: "TestPass1234!", name: "Test Player One",   username: "test_player1" },
  { email: "test_player2@padelxp.test", password: "TestPass1234!", name: "Test Player Two",   username: "test_player2" },
  { email: "test_player3@padelxp.test", password: "TestPass1234!", name: "Test Player Three", username: "test_player3" },
  { email: "test_player4@padelxp.test", password: "TestPass1234!", name: "Test Player Four",  username: "test_player4" },
];

async function registerUser(user: typeof TEST_USERS[number]) {
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password, name: user.name }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.warn(`[${user.email}] signup failed: ${res.status} ${body}`);
    return null;
  }
  console.log(`[${user.email}] signed up`);
  return await res.json();
}

async function loginAndCompleteOnboarding(user: typeof TEST_USERS[number]) {
  // Sign in to get session cookie
  const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  if (!loginRes.ok) {
    console.warn(`[${user.email}] login failed`);
    return;
  }
  const cookies = loginRes.headers.get("set-cookie") ?? "";

  // Complete onboarding (create player profile)
  const onboardRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookies },
    body: JSON.stringify({ username: user.username, displayName: user.name, position: "right" }),
  });
  if (!onboardRes.ok) {
    const body = await onboardRes.text();
    console.warn(`[${user.email}] onboarding failed: ${onboardRes.status} ${body}`);
    return;
  }
  console.log(`[${user.email}] onboarding complete`);
}

for (const user of TEST_USERS) {
  await registerUser(user);
  await loginAndCompleteOnboarding(user);
}

console.log("Seed complete. Add friendships between test players manually via /crew or admin panel.");
