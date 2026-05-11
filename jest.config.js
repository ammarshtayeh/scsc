const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./"
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/playwright-report/",
    "/test-results/",
    "/tests/e2e/",
    "/cypress/"
  ]
};

module.exports = createJestConfig(customJestConfig);
