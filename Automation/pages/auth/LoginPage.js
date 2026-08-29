const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');

class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.loginCard = page.locator('#login-card');
    this.heading = page.locator('#welcome-heading');
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('#login-submit-btn');
    this.errorBanner = page.locator('#error-banner');
    this.successBanner = page.locator('#success-banner');
    this.togglePasswordBtn = page.locator('.toggle-password');
    this.adminEmailHint = page.locator('#admin-email-hint');
    this.registerLink = page.locator('#goto-register-link');
    this.trustBadges = page.locator('.trust-badges');
  }

  async navigate() {
    await this.navigateTo('/');
  }

  async login(username, password) {
    await this.waitForCardHydrated('#login-card');

    if (username !== null && username !== undefined) {
      await this.safeFill(this.usernameInput, username);
    }
    if (password !== null && password !== undefined) {
      await this.safeFill(this.passwordInput, password);
    }

    // Ensure React retained both input values
    if (username && (await this.usernameInput.inputValue()) !== username) {
      await this.safeFill(this.usernameInput, username);
    }
    if (password && (await this.passwordInput.inputValue()) !== password) {
      await this.safeFill(this.passwordInput, password);
    }

    await this.page.waitForTimeout(150);
    await this.submitButton.click();

    await Promise.race([
      this.page.waitForURL(/\/(admin|manager|dashboard)/, { timeout: 25000 }),
      this.errorBanner.waitFor({ state: 'visible', timeout: 25000 }),
    ]).catch(() => {});
  }

  async togglePasswordVisibility() {
    await this.waitForCardHydrated('#login-card');
    await this.togglePasswordBtn.click();
    await this.page.waitForTimeout(200);
  }

  async getPasswordInputType() {
    return await this.passwordInput.getAttribute('type');
  }

  async clickRegisterLink() {
    await this.registerLink.click();
  }

  async verifyAdminHint(expectedEmail = 'jrqaengineer06@gmail.com') {
    await expect(this.adminEmailHint).toBeVisible({ timeout: 10000 });
    await expect(this.adminEmailHint).toContainText(expectedEmail);
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

module.exports = { LoginPage };
