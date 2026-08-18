const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Dark Theme & Color Contrast Automation Tests', () => {
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

  test('THEME-02: Should toggle to Dark theme and verify element visibility & contrast', async () => {
    await loginPage.navigate();
    
    // Toggle to Dark Mode
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();

    // Verify all key elements remain 100% visible & legible in Dark Mode
    await expect(loginPage.loginCard).toBeVisible();
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.heading).toHaveText('Welcome Back');
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.autofillBtn).toBeVisible();

    // Verify input interaction in Dark Mode
    await loginPage.clickAutofill();
    await expect(loginPage.usernameInput).toHaveValue(TestDataGenerator.demoCredentials.email);
    await expect(loginPage.passwordInput).toHaveValue(TestDataGenerator.demoCredentials.password);
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
    await expect(registerPage.nameInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();

    // Revert back to Light Mode and verify
    await registerPage.toggleTheme();
    await registerPage.verifyLightThemeActive();
  });

  test('THEME-04: Should login and verify Protected Dashboard UI in Dark Theme', async () => {
    await loginPage.navigate();
    
    // Enable Dark Theme before login
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();

    // Perform Login
    const { email, password } = TestDataGenerator.demoCredentials;
    await loginPage.login(email, password);

    // Verify Dashboard components in Dark Mode
    await dashboardPage.verifyDashboardLoaded('Demo Admin');
    await dashboardPage.verifyDarkThemeActive();
    await dashboardPage.verifyActivityMonitor();
    await expect(dashboardPage.welcomeHeading).toBeVisible();
    await expect(dashboardPage.logoutBtn).toBeVisible();

    // Perform Logout
    await dashboardPage.logout();
  });

  test('THEME-05: Dark Theme Visual Snapshot Regression - Login Page', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();

    // Full-page Visual Snapshot comparison for Dark Theme
    await expect(page).toHaveScreenshot('login-page-dark-theme.png', {
      maxDiffPixelRatio: 0.2,
      caret: 'hide',
      scale: 'css',
      animations: 'disabled',
    });
  });

  test('THEME-06: Dark Theme Visual Snapshot Regression - Login Card Component', async () => {
    await loginPage.navigate();
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();

    // Component-level Visual Snapshot comparison for Dark Theme Card
    await expect(loginPage.loginCard).toHaveScreenshot('login-card-dark-theme.png', {
      maxDiffPixelRatio: 0.25,
      caret: 'hide',
      scale: 'css',
      animations: 'disabled',
    });
  });

  test('THEME-07: Dark Theme Visual Snapshot Regression - Register Page', async ({ page }) => {
    await registerPage.navigate();
    await registerPage.toggleTheme();
    await registerPage.verifyDarkThemeActive();

    // Full-page Visual Snapshot comparison for Register Page in Dark Theme
    await expect(page).toHaveScreenshot('register-page-dark-theme.png', {
      maxDiffPixelRatio: 0.2,
      caret: 'hide',
      scale: 'css',
      animations: 'disabled',
    });
  });
});
