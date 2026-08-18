// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

/**
 * Playwright Test Configuration
 * Configured to http://localhost:3000
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for */
  timeout: 60 * 1000,
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.2,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  /* Run tests in parallel */
  fullyParallel: true,
  /* Fail build on CI if test.only is left in code */
  forbidOnly: !!process.env.CI,
  /* Retry failed tests */
  retries: process.env.CI ? 2 : 1,
  /* Workers count */
  workers: process.env.CI ? 1 : 2,
  /* HTML Reporter */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  /* Shared options for all projects */
  use: {
    launchOptions: {
      slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0
    },
    /* Base URL for Next.js web application configured to localhost */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    /* Action & Navigation timeouts */
    actionTimeout: 15000,
    navigationTimeout: 30000,
    /* Collect trace when retrying failed tests */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Automatically start Next.js web server on localhost before running tests */
  webServer: {
    command: 'npm run start',
    cwd: path.resolve(__dirname, '../Project'),
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60 * 1000,
  },

  /* Configure projects for major browsers & viewports */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'toolkit.telemetry.enabled': false,
            'messaging-system.rCS.enabled': false,
            'services.settings.server': '',
          },
        },
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Mobile Viewports for Responsive Testing */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
