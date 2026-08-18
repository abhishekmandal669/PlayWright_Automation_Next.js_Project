const { test, expect } = require('@playwright/test');
const { RegisterPage } = require('../pages/RegisterPage');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('End-to-End User Auth Lifecycle', () => {
  test('E2E-01: Full User Journey (Register -> Auto-Redirect -> Login -> Dashboard -> Logout)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Generate unique random test credentials
    const newUser = TestDataGenerator.generateUser();

    // Step 1: Navigate to Registration Page
    await registerPage.navigate();
    await expect(page).toHaveURL(/\/register/);

    // Step 2: Fill Registration Form & Submit
    await registerPage.register(newUser.name, newUser.email, newUser.password, newUser.password);
    await registerPage.verifySuccessBanner('Account created successfully');

    // Step 3: Wait for Auto-Redirect to Login Page
    await expect(page).toHaveURL(/\//, { timeout: 10000 });

    // Step 4: Login with newly created user
    await loginPage.login(newUser.email, newUser.password);

    // Step 5: Verify Protected Dashboard Access
    await dashboardPage.verifyDashboardLoaded(newUser.name);
    await dashboardPage.verifyActivityMonitor();

    // Step 6: Perform Logout
    await dashboardPage.logout();
    await expect(page).toHaveURL(/\//);
  });
});
