const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Dark & Light Theme Automation Tests', () => {
  let loginPage;
  let registerPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('THEME-01: Verify default Light theme load and toggle button state', async () => {
    await loginPage.navigate();
    await loginPage.verifyLightThemeActive();
  });

  test('THEME-02: Should toggle to Dark theme and verify data-theme attribute & contrast', async () => {
    await loginPage.navigate();

    // Toggle to Dark Mode
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();

    // Verify key elements remain visible in Dark Mode
    await expect(loginPage.loginCard).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('THEME-03: Verify Dark theme persistence across page navigations', async ({ page }) => {
    await loginPage.navigate();

    // Toggle to Dark Mode on Login page
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();

    // Navigate to Register page and verify Dark Mode persists
    await loginPage.clickRegisterLink();
    await expect(page).toHaveURL(/\/register/);
    await registerPage.verifyDarkThemeActive();
    await expect(registerPage.registerCard).toBeVisible();

    // Revert back to Light Mode and verify
    await registerPage.toggleTheme();
    await registerPage.verifyLightThemeActive();
  });

  test('THEME-04: Should login and verify Dashboard UI in Dark Theme', async () => {
    const user = TestDataGenerator.superAdmin;
    await loginPage.navigate();

    // Enable Dark Theme before login
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();

    // Perform Login
    await loginPage.login(user.email, user.password);

    // Verify Dark Mode active on protected page
    await dashboardPage.verifyDarkThemeActive();

    // Perform Logout
    await dashboardPage.logout();
  });
});
