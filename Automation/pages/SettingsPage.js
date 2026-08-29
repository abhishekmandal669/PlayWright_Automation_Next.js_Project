const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class SettingsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.nameInput = page.locator('form input[type="text"]').first();
    this.deptInput = page.locator('form input[type="text"]').nth(1);
    this.saveProfileBtn = page.locator('button:has-text("Save Profile Changes")');
    this.setupMfaBtn = page.locator('button:has-text("Setup 2FA →"), button:has-text("Disable 2FA")');
    this.successAlert = page.locator('.bg-\\[\\#E8F2EA\\], .alert-success, div:has-text("✓")');
  }

  async verifySettingsLoaded() {
    await expect(this.page).toHaveURL(/\/settings/, { timeout: 20000 });
    await expect(this.nameInput).toBeVisible({ timeout: 20000 });
    await expect(this.saveProfileBtn).toBeVisible({ timeout: 20000 });
  }

  async updateProfileDetails({ name, department }) {
    if (name) await this.nameInput.fill(name);
    if (department) await this.deptInput.fill(department);
    await this.saveProfileBtn.click();
    await expect(this.successAlert.first()).toBeVisible({ timeout: 10000 });
  }

  async toggleTwoFactor() {
    await expect(this.setupMfaBtn.first()).toBeVisible();
  }
}

module.exports = { SettingsPage };
