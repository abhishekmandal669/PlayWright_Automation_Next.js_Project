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
    this.avatarFileInput = page.locator('#profile-avatar-input');
    this.uploadPhotoBtn = page.locator('#upload-photo-btn');
    this.removePhotoBtn = page.locator('#remove-photo-btn');
    this.avatarImage = page.locator('div.w-16.h-16 img, div.w-20.h-20 img');
    this.avatarInitial = page.locator('div.w-16.h-16 span, div.w-20.h-20 span');
  }

  async verifyProfileLoaded(expectedName, expectedEmail, expectedRole) {
    await expect(this.page).toHaveURL(/\/profile/, { timeout: 20000 });
    await expect(this.profileCard.first()).toBeVisible({ timeout: 20000 });
    if (expectedName) await expect(this.profileName.first()).toContainText(expectedName, { timeout: 20000 });
    if (expectedEmail) await expect(this.profileEmail.first()).toContainText(expectedEmail, { timeout: 20000 });
    if (expectedRole) await expect(this.rolePill.first()).toContainText(expectedRole, { timeout: 20000, ignoreCase: true });
  }

  async uploadAvatar(filePath) {
    await this.avatarFileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(500);
  }

  async removeAvatar() {
    if (await this.removePhotoBtn.isVisible()) {
      await this.removePhotoBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  async verifyAvatarUploaded() {
    await expect(this.avatarImage).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { ProfilePage };
