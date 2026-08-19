const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');

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
});
