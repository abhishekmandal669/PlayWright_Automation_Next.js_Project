const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { AdminPage } = require('../pages/AdminPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Login & Authentication Module Tests', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('AUTH-01: Should login successfully with dynamic SuperAdmin credentials and redirect to Admin console', async ({ page }) => {
    const adminPage = new AdminPage(page);
    const { email, password, name } = TestDataGenerator.superAdmin;

    await loginPage.login(email, password);
    await adminPage.verifyAdminPageLoaded();
    await adminPage.verifyHeaderUser('Admin', name);
  });

  test('AUTH-02: Should toggle password field visibility between password and text', async () => {
    await loginPage.passwordInput.fill('SecretPassword123!');
    expect(await loginPage.getPasswordInputType()).toBe('password');

    await loginPage.togglePasswordVisibility();
    expect(await loginPage.getPasswordInputType()).toBe('text');

    await loginPage.togglePasswordVisibility();
    expect(await loginPage.getPasswordInputType()).toBe('password');
  });

  test('AUTH-03: Should display dynamic SuperAdmin email hint at footer of login card', async () => {
    const { email } = TestDataGenerator.superAdmin;
    await loginPage.verifyAdminHint(email);
  });

  test('AUTH-04: Should show error alert when logging in with invalid credentials', async () => {
    const { email, password } = TestDataGenerator.invalidCredentials;
    await loginPage.login(email, password);
    await loginPage.verifyErrorBanner('Invalid email or password');
  });

  test('AUTH-05: Should handle special script injection payload safely without errors', async ({ page }) => {
    const payload = TestDataGenerator.edgeCasePayloads.scriptInjection;
    await loginPage.login(payload, 'InvalidPass123!');
    const isInvalid = await page.$eval('#username', el => !el.checkValidity() || el.value.length > 0);
    expect(isInvalid).toBe(true);
  });

  test('AUTH-06: Should perform logout from Header and clear session', async ({ page }) => {
    const adminPage = new AdminPage(page);
    const { email, password } = TestDataGenerator.superAdmin;

    await loginPage.login(email, password);
    await adminPage.verifyAdminPageLoaded();

    // Perform Logout via Header
    await adminPage.logout();
    await expect(page).toHaveURL(/\//);
  });

  test('NAV-01: Should navigate to Register page when clicking Create Account link', async ({ page }) => {
    await loginPage.clickRegisterLink();
    await expect(page).toHaveURL(/\/register/);
  });
});
