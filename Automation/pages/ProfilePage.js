const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class ProfilePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.profileCard = page.locator('.profile-hero-card');
    this.profileName = page.locator('.profile-hero-info h1');
    this.profileEmail = page.locator('.profile-email');
    this.rolePill = page.locator('.role-pill');
    this.statusPill = page.locator('.status-pill');
    this.editSettingsBtn = page.locator('a:has-text("Edit Profile & Settings")');
  }

  async verifyProfileLoaded(expectedName, expectedEmail, expectedRole) {
    await expect(this.page).toHaveURL(/\/profile/, { timeout: 15000 });
    await expect(this.profileCard).toBeVisible({ timeout: 15000 });
    if (expectedName) await expect(this.profileName).toContainText(expectedName, { timeout: 15000 });
    if (expectedEmail) await expect(this.profileEmail).toContainText(expectedEmail, { timeout: 15000 });
    if (expectedRole) await expect(this.rolePill).toContainText(expectedRole, { timeout: 15000, ignoreCase: true });
  }
}

module.exports = { ProfilePage };
