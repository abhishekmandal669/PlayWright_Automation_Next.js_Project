const path = require('path');
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { RegisterPage } = require('../../pages/auth/RegisterPage');
const { ProfilePage } = require('../../pages/customer/ProfilePage');
const { SettingsPage } = require('../../pages/customer/SettingsPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('Profile & Settings Management Tests', () => {
  let loginPage;
  let registerPage;
  let profilePage;
  let settingsPage;
  let user;
  const fixtureImagePath = path.resolve(__dirname, '../../fixtures/sample-avatar.png');

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    profilePage = new ProfilePage(page);
    settingsPage = new SettingsPage(page);

    // Register a fresh customer
    user = TestDataGenerator.generateUser();
    await registerPage.navigate();
    await registerPage.register(user.name, user.email, user.password, user.password);
    await registerPage.verifySuccessBanner('Account created successfully');

    // Login and wait for dashboard session to establish
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('PROF-01: Should display customer profile metadata and account details', async () => {
    await profilePage.navigateTo('/profile');
    await profilePage.verifyProfileLoaded(user.name, user.email, 'User');
  });

  test('PROF-02: Should upload avatar profile picture and display image preview', async () => {
    await profilePage.navigateTo('/profile');
    await profilePage.verifyProfileLoaded(user.name, user.email, 'User');

    await profilePage.uploadAvatar(fixtureImagePath);
    await profilePage.verifyAvatarUploaded();
  });

  test('PROF-03: Should remove uploaded avatar and revert to initial avatar fallback', async () => {
    await profilePage.navigateTo('/profile');
    await profilePage.verifyProfileLoaded(user.name, user.email, 'User');

    // Upload first
    await profilePage.uploadAvatar(fixtureImagePath);
    await profilePage.verifyAvatarUploaded();

    // Remove photo
    await profilePage.removeAvatar();
    await expect(profilePage.avatarInitial.first()).toBeVisible({ timeout: 10000 });
  });

  test('SETT-01: Should update personal profile settings (Name & Department)', async () => {
    await settingsPage.navigateTo('/settings');
    await settingsPage.verifySettingsLoaded();

    await settingsPage.updateProfileDetails({
      name: `${user.name} (Updated)`,
      department: 'Enterprise Logistics',
    });

    await settingsPage.toggleTwoFactor();
  });

  test('SETT-02: Should upload and remove avatar in Settings page', async () => {
    await settingsPage.navigateTo('/settings');
    await settingsPage.verifySettingsLoaded();

    await settingsPage.uploadAvatar(fixtureImagePath);
    await expect(settingsPage.avatarPreviewImg).toBeVisible({ timeout: 10000 });

    await settingsPage.removeAvatar();
  });
});
