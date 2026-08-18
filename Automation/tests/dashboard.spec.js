const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Dashboard Module & Activity Monitor Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
    
    // Login with demo credentials to reach Dashboard
    const { email, password } = TestDataGenerator.demoCredentials;
    await loginPage.login(email, password);
    await dashboardPage.verifyDashboardLoaded('Demo Admin');
  });

  test('DASH-01: Should verify Real-Time Activity Log Table and Latency Monitor', async () => {
    await dashboardPage.verifyActivityMonitor();
  });

  test('DASH-02: Should logout successfully from Dashboard', async () => {
    await dashboardPage.logout();
  });
});
