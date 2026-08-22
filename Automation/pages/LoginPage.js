const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

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
    if (username !== null && username !== undefined) {
      await this.usernameInput.fill(username);
    }
    if (password !== null && password !== undefined) {
      await this.passwordInput.fill(password);
    }
    await this.submitButton.click();

    // Wait for either URL navigation or error/success banner
    await Promise.race([
      this.page.waitForURL((url) => url.pathname !== '/', { timeout: 8000 }).catch(() => {}),
      this.errorBanner.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
      this.successBanner.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
    ]);
  }

  async togglePasswordVisibility() {
    await this.togglePasswordBtn.click();
  }

  async getPasswordInputType() {
    return await this.passwordInput.getAttribute('type');
  }

  async clickRegisterLink() {
    await this.registerLink.click();
  }

  async verifyAdminHint(expectedEmail = 'jrqaengineer06@gmail.com') {
    await expect(this.adminEmailHint).toBeVisible();
    await expect(this.adminEmailHint).toContainText(expectedEmail);
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

module.exports = { LoginPage };
