import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.CI ? undefined : "msedge",
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        channel: process.env.CI ? undefined : "msedge",
      },
    },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next start -p 3100",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      RESEND_API_KEY: "test-only-never-send",
      CONTACT_FROM_EMAIL: "sender@example.test",
      CONTACT_TO_EMAIL: "owner@example.test",
    },
  },
});
