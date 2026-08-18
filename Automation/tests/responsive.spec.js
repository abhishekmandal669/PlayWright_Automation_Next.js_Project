const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');

test.describe('Responsive Viewport Tests', () => {
  const viewports = [
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile Screen', width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    test(`RESP-01: Verify Login Page responsive layout on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const loginPage = new LoginPage(page);
      await loginPage.navigate();

      await expect(loginPage.loginCard).toBeVisible();
      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    });

    test(`RESP-02: Verify Register Page responsive layout on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const registerPage = new RegisterPage(page);
      await registerPage.navigate();

      await expect(registerPage.registerCard).toBeVisible();
      await expect(registerPage.nameInput).toBeVisible();
      await expect(registerPage.emailInput).toBeVisible();
      await expect(registerPage.submitButton).toBeVisible();
    });
  }
});
