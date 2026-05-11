import { defineConfig } from "cypress";

const baseUrl = process.env.BASE_URL || "https://scsc-iota.vercel.app";

export default defineConfig({
  e2e: {
    baseUrl,
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    supportFile: "cypress/support/e2e.ts"
  },
  video: true,
  screenshotOnRunFailure: true
});
