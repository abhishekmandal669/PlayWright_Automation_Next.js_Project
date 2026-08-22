const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class SettingsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.nameInput = page.locator('.form-group:has(label:has-text("Full Name")) input');
    this.emailInput = page.locator('.form-group:has(label:has-text("Work Email")) input');
    this.deptInput = page.locator('.form-group:has(label:has-text("Department")) input');
    this.saveProfileBtn = page.locator('button:has-text("Save Profile Changes")');

    this.currentPassInput = page.locator('.form-group:has(label:has-text("Current Password")) input');
    this.newPassInput = page.locator('.form-group:has(label:has-text("New Password")) input');
    this.twoFactorCheckbox = page.locator('label.checkbox-label:has-text("Two-Factor") input');
    this.updatePassBtn = page.locator('button:has-text("Update Security Password")');
    this.successAlert = page.locator('.alert-success');
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
    await expect(this.successAlert).toBeVisible();
  }

  async toggleTwoFactor() {
    await this.twoFactorCheckbox.click();
  }
}

module.exports = { SettingsPage };
