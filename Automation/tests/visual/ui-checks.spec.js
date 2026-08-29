const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { RegisterPage } = require('../../pages/auth/RegisterPage');
const { CreateOrderStudioPage } = require('../../pages/operations/CreateOrderStudioPage');
const { DispatcherPage } = require('../../pages/operations/DispatcherPage');
const { DriversPage } = require('../../pages/operations/DriversPage');
const { ForgotPasswordPage } = require('../../pages/auth/ForgotPasswordPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('UI Component & Visual Verification Tests', () => {
  let loginPage;
  let registerPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
  });

  test('UI-01: Verify brand logo in header bar', async () => {
    await loginPage.navigate();
    await loginPage.verifyBrandHeader();
  });

  test('UI-02: Verify login card container styling and headings', async () => {
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();
  });

  test('UI-03: Verify primary action submit button is visible and active', async () => {
    await loginPage.navigate();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('UI-04: Verify register card container and form elements', async () => {
    await registerPage.navigate();
    await expect(registerPage.registerCard).toBeVisible();
    await expect(registerPage.nameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
  });

  test('UI-05: Verify Order Creation Studio UI controls and preset buttons', async ({ page }) => {
    const studioPage = new CreateOrderStudioPage(page);
    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await studioPage.navigate();

    await expect(studioPage.studioHeading).toBeVisible();
    await expect(studioPage.presetSmallBtn).toBeVisible();
    await expect(studioPage.presetStandardBtn).toBeVisible();
    await expect(studioPage.presetHeavyBtn).toBeVisible();
    await expect(studioPage.presetCustomBtn).toBeVisible();
    await expect(studioPage.submitOrderButton).toBeVisible();
  });

  test('UI-06: Verify Dispatcher Staging Hub metrics cards and map container', async ({ page }) => {
    const dispatcherPage = new DispatcherPage(page);
    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await dispatcherPage.navigate();

    await expect(dispatcherPage.dispatcherHeading).toBeVisible();
    await expect(dispatcherPage.expandAllBtn).toBeVisible();
    await expect(dispatcherPage.mapContainer).toBeVisible();
  });

  test('UI-07: Verify Fleet & Driver Operations roster and modal controls', async ({ page }) => {
    const driversPage = new DriversPage(page);
    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await driversPage.navigate();

    await expect(driversPage.driversHeading).toBeVisible();
    await expect(driversPage.registerDriverBtn).toBeVisible();
    await expect(driversPage.filterAllBtn).toBeVisible();
    await expect(driversPage.searchInput).toBeVisible();
  });

  test('UI-08: Verify Forgot Password security page and OTP hint container', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.navigate();

    await expect(forgotPasswordPage.heading).toBeVisible();
    await expect(forgotPasswordPage.emailInput).toBeVisible();
    await expect(forgotPasswordPage.sendCodeBtn).toBeVisible();
  });
});
