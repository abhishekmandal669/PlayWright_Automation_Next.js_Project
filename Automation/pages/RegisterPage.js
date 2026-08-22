const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class RegisterPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.registerCard = page.locator('#register-card');
    this.nameInput = page.locator('#register-name');
    this.emailInput = page.locator('#register-email');
    this.passwordInput = page.locator('#register-password');
    this.confirmPasswordInput = page.locator('#register-confirm-password');
    this.submitButton = page.locator('#register-submit-btn');
    this.errorBanner = page.locator('#register-error-banner');
    this.successBanner = page.locator('#register-success-banner');
    this.loginLink = page.locator('#goto-login-link');
  }

  async navigate() {
    await this.navigateTo('/register');
  }

  async register(name, email, password, confirmPassword) {
    if (name !== null && name !== undefined) {
      await this.nameInput.fill(name);
    }
    if (email !== null && email !== undefined) {
      await this.emailInput.fill(email);
    }
    if (password !== null && password !== undefined) {
      await this.passwordInput.fill(password);
    }
    if (confirmPassword !== null && confirmPassword !== undefined) {
      await this.confirmPasswordInput.fill(confirmPassword);
    }
    await this.submitButton.click();

    // Wait for form submission result — either success banner, error banner, or URL redirect
    await Promise.race([
      this.successBanner.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
      this.errorBanner.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
      this.page.waitForURL('/', { timeout: 8000 }).catch(() => {}),
    ]);
  }

  async clickLoginLink() {
    await this.loginLink.click();
  }

  async verifyErrorBanner(expectedMessage) {
    await expect(this.errorBanner).toBeVisible({ timeout: 10000 });
    if (expectedMessage) {
      await expect(this.errorBanner).toContainText(expectedMessage, { timeout: 10000 });
    }
  }

  async verifySuccessBanner(expectedMessage) {
    await expect(this.successBanner).toBeVisible({ timeout: 10000 });
    if (expectedMessage) {
      await expect(this.successBanner).toContainText(expectedMessage, { timeout: 10000 });
    }
  }
}

module.exports = { RegisterPage };
