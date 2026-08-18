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
    this.autofillBtn = page.locator('#autofill-btn');
    this.registerLink = page.locator('#goto-register-link');
    
    // New Feature Locators
    this.ssoButtons = page.locator('.sso-btn');
    this.rememberMeCheckbox = page.locator('.checkbox-label input');
    this.forgotPasswordLink = page.locator('.form-options .link-highlight');
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
  }

  async clickAutofill() {
    await this.autofillBtn.click();
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

  async verifyNewFeatures() {
    await expect(this.ssoButtons).toHaveCount(2);
    await expect(this.rememberMeCheckbox).toBeChecked();
    await expect(this.forgotPasswordLink).toBeVisible();
    await expect(this.trustBadges).toBeVisible();
  }
}

module.exports = { LoginPage };
