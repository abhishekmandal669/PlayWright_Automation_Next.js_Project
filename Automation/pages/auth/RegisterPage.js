const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');

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
    await this.waitForCardHydrated('#register-card');

    if (name !== null && name !== undefined) {
      await this.safeFill(this.nameInput, name);
    }
    if (email !== null && email !== undefined) {
      await this.safeFill(this.emailInput, email);
    }
    if (password !== null && password !== undefined) {
      await this.safeFill(this.passwordInput, password);
    }
    if (confirmPassword !== null && confirmPassword !== undefined) {
      await this.safeFill(this.confirmPasswordInput, confirmPassword);
    }

    // Ensure React retained input values
    if (name && (await this.nameInput.inputValue()) !== name) await this.safeFill(this.nameInput, name);
    if (email && (await this.emailInput.inputValue()) !== email) await this.safeFill(this.emailInput, email);
    if (password && (await this.passwordInput.inputValue()) !== password) await this.safeFill(this.passwordInput, password);
    if (confirmPassword && (await this.confirmPasswordInput.inputValue()) !== confirmPassword) await this.safeFill(this.confirmPasswordInput, confirmPassword);

    await this.page.waitForTimeout(150);
    await this.submitButton.click();

    await Promise.race([
      this.successBanner.waitFor({ state: 'visible', timeout: 20000 }),
      this.errorBanner.waitFor({ state: 'visible', timeout: 20000 }),
    ]).catch(() => {});
  }

  async clickLoginLink() {
    await this.loginLink.waitFor({ state: 'visible', timeout: 15000 });
    await this.loginLink.click();
  }

  async verifyErrorBanner(expectedMessage) {
    await expect(this.errorBanner).toBeVisible({ timeout: 15000 });
    if (expectedMessage) {
      await expect(this.errorBanner).toContainText(expectedMessage, { timeout: 10000 });
    }
  }

  async verifySuccessBanner(expectedMessage) {
    await expect(this.successBanner).toBeVisible({ timeout: 15000 });
    if (expectedMessage) {
      await expect(this.successBanner).toContainText(expectedMessage, { timeout: 10000 });
    }
  }
}

module.exports = { RegisterPage };
