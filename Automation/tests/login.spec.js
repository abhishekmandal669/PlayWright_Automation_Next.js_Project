const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { AdminPage } = require('../pages/AdminPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Authentication & Login Module Tests', () => {
  let loginPage;
  let adminPage;
  let registerPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    adminPage = new AdminPage(page);
    registerPage = new RegisterPage(page);
  });

  test('LOG-01: Should login successfully with valid SuperAdmin credentials', async () => {
    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await adminPage.verifyAdminPageLoaded();
  });

  test('LOG-02: Should display error banner with invalid credentials', async () => {
    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.invalidCredentials.email, TestDataGenerator.invalidCredentials.password);
    await loginPage.verifyErrorBanner('Invalid email or password');
  });

  test('LOG-03: Toggle password visibility changes input type between password and text', async () => {
    await loginPage.navigate();
    expect(await loginPage.getPasswordInputType()).toBe('password');
    await loginPage.togglePasswordVisibility();
    expect(await loginPage.getPasswordInputType()).toBe('text');
    await loginPage.togglePasswordVisibility();
    expect(await loginPage.getPasswordInputType()).toBe('password');
  });

  test('LOG-04: Admin hint is visible and displays configured admin email', async () => {
    await loginPage.navigate();
    await loginPage.verifyAdminHint(TestDataGenerator.superAdmin.email);
  });

  test('LOG-05: Clicking Create Account link navigates to /register', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.clickRegisterLink();
    await expect(page).toHaveURL(/\/register/);
    await expect(registerPage.registerCard).toBeVisible();
  });
});
