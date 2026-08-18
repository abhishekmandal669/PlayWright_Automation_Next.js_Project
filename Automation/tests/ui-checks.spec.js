const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');

test.describe('UI Visual Snapshot Comparison Tests', () => {
  let loginPage;
  let registerPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
  });

  test('UI-01: Verify brand logo and accent badge in header bar', async () => {
    await loginPage.navigate();
    await loginPage.verifyBrandHeader();
    await expect(loginPage.accentBadge).toContainText('Playwright Target');
  });

  test('UI-02: Verify card container styling and elevation elements', async () => {
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();
    await expect(loginPage.heading).toHaveText('Welcome Back');
  });

  test('UI-03: Verify primary action button and computed styles', async () => {
    await loginPage.navigate();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toHaveText('Sign In');
    
    // Check computed style background gradient/color
    const buttonBg = await loginPage.submitButton.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundImage || style.backgroundColor;
    });

    // Verify button background uses gradient or primary blue
    expect(buttonBg).toMatch(/linear-gradient|rgb\(46, 111, 232\)/);
  });

  test('VISUAL-01: Full-page visual regression check for Login Page', async ({ page }) => {
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();
    
    // Visual pixel-by-pixel screenshot comparison
    await expect(page).toHaveScreenshot('login-page-visual.png', {
      maxDiffPixelRatio: 0.2,
      caret: 'hide',
      scale: 'css',
      animations: 'disabled',
    });
  });

  test('VISUAL-02: Component-level visual regression check for Login Card', async () => {
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();
    
    // Component screenshot comparison with robust tolerance and caret hiding
    await expect(loginPage.loginCard).toHaveScreenshot('login-card-component.png', {
      maxDiffPixelRatio: 0.25,
      caret: 'hide',
      scale: 'css',
      animations: 'disabled',
    });
  });

  test('VISUAL-03: Full-page visual regression check for Register Page', async ({ page }) => {
    await registerPage.navigate();
    await expect(registerPage.registerCard).toBeVisible();
    
    // Register page visual screenshot comparison
    await expect(page).toHaveScreenshot('register-page-visual.png', {
      maxDiffPixelRatio: 0.2,
      caret: 'hide',
      scale: 'css',
      animations: 'disabled',
    });
  });
});
