const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');

class ProfilePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.profileCard = page.locator('.paper-card');
    this.profileName = page.locator('.paper-card h2');
    this.profileEmail = page.locator('.paper-card p');
    this.rolePill = page.locator('.paper-card span.pill-blue, .paper-card span.pill-amber, .paper-card span.pill-green');
    this.editSettingsBtn = page.locator('a:has-text("Edit Profile & Settings")');
  }

  async verifyProfileLoaded(expectedName, expectedEmail, expectedRole) {
    await expect(this.page).toHaveURL(/\/profile/, { timeout: 20000 });
    await expect(this.profileCard.first()).toBeVisible({ timeout: 20000 });
    if (expectedName) await expect(this.profileName.first()).toContainText(expectedName, { timeout: 20000 });
    if (expectedEmail) await expect(this.profileEmail.first()).toContainText(expectedEmail, { timeout: 20000 });
    if (expectedRole) await expect(this.rolePill.first()).toContainText(expectedRole, { timeout: 20000, ignoreCase: true });
  }
}

module.exports = { ProfilePage };
