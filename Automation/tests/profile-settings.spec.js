const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { ProfilePage } = require('../pages/ProfilePage');
const { SettingsPage } = require('../pages/SettingsPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Profile & Settings Management Tests', () => {
  let loginPage;
  let registerPage;
  let profilePage;
  let settingsPage;
  let user;

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

  test('SETT-01: Should update personal profile settings and toggle 2FA security preferences', async () => {
    await settingsPage.navigateTo('/settings');
    await settingsPage.verifySettingsLoaded();

    await settingsPage.updateProfileDetails({
      name: `${user.name} (Updated)`,
      department: 'Enterprise Logistics',
    });

    await settingsPage.toggleTwoFactor();
  });
});
