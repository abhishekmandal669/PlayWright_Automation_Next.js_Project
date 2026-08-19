const { test, expect } = require('@playwright/test');
const { RegisterPage } = require('../pages/RegisterPage');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Registration Module Tests', () => {
  let registerPage;
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await registerPage.navigate();
  });

  test('REG-01: Should register a new customer account successfully and log in', async () => {
    const newUser = TestDataGenerator.generateUser();

    await registerPage.register(newUser.name, newUser.email, newUser.password, newUser.password);
    await registerPage.verifySuccessBanner('Account created successfully');

    // Navigate to login and authenticate
    await loginPage.navigate();
    await loginPage.login(newUser.email, newUser.password);
    await dashboardPage.verifyDashboardLoaded(newUser.name);
  });

  test('REG-02: Should prevent registration with duplicate existing email', async () => {
    const existingAdmin = TestDataGenerator.superAdmin;

    await registerPage.register('Duplicate Name', existingAdmin.email, 'SomePassword123!', 'SomePassword123!');
    await registerPage.verifyErrorBanner('already exists');
  });

  test('REG-03: Should validate password minimum length requirement (less than 6 chars)', async () => {
    await registerPage.register('Short Pass User', 'shortpass@example.com', '123', '123');
    await registerPage.verifyErrorBanner('at least 6 characters');
  });

  test('NAV-02: Should navigate to Login page when clicking Already have an account link', async ({ page }) => {
    await registerPage.clickLoginLink();
    await expect(page).toHaveURL(/\//);
  });
});
