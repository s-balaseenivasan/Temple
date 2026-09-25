import { defineConfig, devices } from "@playwright/test";

// System-installed Microsoft Edge is used instead of Playwright's own bundled
// Chromium — that download times out in this sandbox's network (confirmed
// during initial setup; see IMPLEMENTATION_ENVIRONMENT.md). `channel: "msedge"`
// works identically for testing purposes.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // the local prisma dev database was found unreliable under concurrent load
  // `fullyParallel: false` only serializes tests within one file — with the
  // default worker count, Playwright still ran different spec files
  // concurrently across workers, and that cross-file concurrency was enough
  // to make admin-lockout.spec.ts's login() time out waiting on the single-
  // connection local DB (reproduced twice: passed in isolation, failed
  // consistently as part of the full suite). `workers: 1` fully honors the
  // original intent of the line above instead of only half-applying it.
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
