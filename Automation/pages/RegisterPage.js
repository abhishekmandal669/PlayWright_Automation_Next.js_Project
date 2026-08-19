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

    // Wait for registration to complete — either success banner appears
    // or the app auto-redirects to login page (1200ms setTimeout in RegisterForm)
    await Promise.race([
      this.successBanner.waitFor({ state: 'visible', timeout: 10000 }),
      this.page.waitForURL('/', { timeout: 10000 }),
    ]);
  }

  async clickLoginLink() {
    await this.loginLink.click();
  }

  async verifyErrorBanner(expectedMessage) {
    await expect(this.errorBanner).toBeVisible();
    if (expectedMessage) {
      await expect(this.errorBanner).toContainText(expectedMessage);
    }
  }

  async verifySuccessBanner(expectedMessage) {
    await expect(this.successBanner).toBeVisible();
    if (expectedMessage) {
      await expect(this.successBanner).toContainText(expectedMessage);
    }
  }
}

module.exports = { RegisterPage };
