export const TEST_USERS = {
  player1: {
    email:    "test_player1@padelxp.test",
    password: "TestPass1234!",
    name:     "Test Player One",
  },
  player2: {
    email:    "test_player2@padelxp.test",
    password: "TestPass1234!",
    name:     "Test Player Two",
  },
  player3: {
    email:    "test_player3@padelxp.test",
    password: "TestPass1234!",
    name:     "Test Player Three",
  },
  player4: {
    email:    "test_player4@padelxp.test",
    password: "TestPass1234!",
    name:     "Test Player Four",
  },
} as const;

export const ADMIN = {
  username: process.env.TEST_ADMIN_USERNAME ?? "admin",
  password: process.env.TEST_ADMIN_PASSWORD ?? "",
};
