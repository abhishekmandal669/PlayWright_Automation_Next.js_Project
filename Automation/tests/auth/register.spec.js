const { test, expect } = require('@playwright/test');
const { RegisterPage } = require('../../pages/auth/RegisterPage');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { DashboardPage } = require('../../pages/customer/DashboardPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('Registration Module Tests', () => {
  let registerPage;
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('REG-01: Should register a new customer account successfully and log in', async () => {
    const newUser = TestDataGenerator.generateUser();
    await registerPage.navigate();
    await registerPage.register(newUser.name, newUser.email, newUser.password, newUser.password);
    await registerPage.verifySuccessBanner('Account created successfully');

    // Wait for Next.js redirect timer to settle
    await registerPage.page.waitForTimeout(1500);

    await loginPage.navigate();
    await loginPage.login(newUser.email, newUser.password);
    await dashboardPage.verifyDashboardLoaded(newUser.name);
  });

  test('REG-02: Should prevent registration with duplicate existing email', async () => {
    const existingUser = TestDataGenerator.generateUser();
    await registerPage.navigate();
    await registerPage.register(existingUser.name, existingUser.email, existingUser.password, existingUser.password);
    await registerPage.verifySuccessBanner('Account created successfully');

    // Wait for Next.js redirect timer to settle
    await registerPage.page.waitForTimeout(1500);

    // Try registering with same email again
    await registerPage.navigate();
    await registerPage.register('Duplicate Tester', existingUser.email, 'Password@123', 'Password@123');
    await registerPage.verifyErrorBanner();
  });

  test('REG-03: Should validate password minimum length requirement (less than 6 chars)', async () => {
    await registerPage.navigate();
    await registerPage.register('Short Pass User', 'short@pass.io', '123', '123');
    await registerPage.verifyErrorBanner('at least 6 characters');
  });

  test('NAV-02: Should navigate to Login page when clicking Already have an account link', async () => {
    await registerPage.navigate();
    await registerPage.clickLoginLink();
    await expect(loginPage.page).toHaveURL(/\//);
    await expect(loginPage.loginCard).toBeVisible();
  });
});
