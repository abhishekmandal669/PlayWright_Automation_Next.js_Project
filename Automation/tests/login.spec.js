const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Login Module Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
  });

  test('POS-01: Should login successfully with valid demo credentials', async () => {
    const { email, password } = TestDataGenerator.demoCredentials;
    await loginPage.login(email, password);
    await dashboardPage.verifyDashboardLoaded('Demo Admin');
  });

  test('POS-02: Should autofill and submit form using quick demo login button', async () => {
    await loginPage.clickAutofill();
    await expect(loginPage.usernameInput).toHaveValue(TestDataGenerator.demoCredentials.email);
    await expect(loginPage.passwordInput).toHaveValue(TestDataGenerator.demoCredentials.password);

    await loginPage.submitButton.click();
    await dashboardPage.verifyDashboardLoaded('Demo Admin');
  });

  test('POS-03: Should toggle password field visibility between password and text', async () => {
    await loginPage.passwordInput.fill('SecretPassword123');
    expect(await loginPage.getPasswordInputType()).toBe('password');

    await loginPage.togglePasswordVisibility();
    expect(await loginPage.getPasswordInputType()).toBe('text');

    await loginPage.togglePasswordVisibility();
    expect(await loginPage.getPasswordInputType()).toBe('password');
  });

  test('POS-04: Should verify SSO Social Buttons, Remember Me option, and Security badges', async () => {
    await loginPage.verifyNewFeatures();
  });

  test('UI-04: Should toggle theme switcher between Light and Dark mode', async ({ page }) => {
    await loginPage.toggleTheme();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await loginPage.toggleTheme();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('NEG-01: Should show error alert when logging in with invalid credentials', async () => {
    const { email, password } = TestDataGenerator.invalidCredentials;
    await loginPage.login(email, password);
    await loginPage.verifyErrorBanner('Invalid email or password');
  });

  test('EDGE-01: Should handle special script injection payload safely', async () => {
    const payload = TestDataGenerator.edgeCasePayloads.scriptInjection;
    await loginPage.login(payload, 'somePassword');
    await loginPage.verifyErrorBanner();
  });

  test('NAV-01: Should navigate to Register page when clicking Create an Account link', async ({ page }) => {
    await loginPage.clickRegisterLink();
    await expect(page).toHaveURL(/\/register/);
  });
});
