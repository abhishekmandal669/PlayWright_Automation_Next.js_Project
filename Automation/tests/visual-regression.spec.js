const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { AdminPage } = require('../pages/AdminPage');
const { ManagerPage } = require('../pages/ManagerPage');
const { ProfilePage } = require('../pages/ProfilePage');
const { SettingsPage } = require('../pages/SettingsPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Visual Regression & UI Snapshot Tests', () => {
  // ── 1. Auth Pages: Light & Dark Theme Snapshots ──
  test('VIS-01: Visual snapshot of Login Page (Light Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();

    await expect(page).toHaveScreenshot('login-page-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('VIS-02: Visual snapshot of Login Page (Dark Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();
    await expect(loginPage.loginCard).toBeVisible();

    await expect(page).toHaveScreenshot('login-page-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('VIS-03: Visual snapshot of Register Page (Light Theme)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();
    await expect(registerPage.registerCard).toBeVisible();

    await expect(page).toHaveScreenshot('register-page-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('VIS-04: Visual snapshot of Register Page (Dark Theme)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();
    await registerPage.toggleTheme();
    await registerPage.verifyDarkThemeActive();
    await expect(registerPage.registerCard).toBeVisible();

    await expect(page).toHaveScreenshot('register-page-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // ── 2. Customer Dashboard & Create Order Modal ──
  test('VIS-05: Visual snapshot of Customer Dashboard (Light Theme)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    const user = TestDataGenerator.generateUser();
    await registerPage.navigate();
    await registerPage.register(user.name, user.email, user.password, user.password);

    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await dashboardPage.verifyDashboardLoaded(user.name);

    await expect(page).toHaveScreenshot('customer-dashboard-light.png', {
      animations: 'disabled',
      mask: [dashboardPage.welcomeHeading],
    });
  });

  test('VIS-06: Visual snapshot of Customer Dashboard (Dark Theme)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    const user = TestDataGenerator.generateUser();
    await registerPage.navigate();
    await registerPage.register(user.name, user.email, user.password, user.password);

    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await dashboardPage.verifyDashboardLoaded(user.name);

    await dashboardPage.toggleTheme();
    await dashboardPage.verifyDarkThemeActive();

    await expect(page).toHaveScreenshot('customer-dashboard-dark.png', {
      animations: 'disabled',
      mask: [dashboardPage.welcomeHeading],
    });
  });

  test('VIS-07: Visual snapshot of Create Order Modal Popup', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await page.goto('/dashboard');
    await dashboardPage.openCreateOrderModal();

    await expect(page).toHaveScreenshot('create-order-modal.png', {
      animations: 'disabled',
    });
  });

  // ── 3. Admin Master Console & Invite Modal ──
  test('VIS-08: Visual snapshot of Admin Master Console (Light Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await adminPage.verifyAdminPageLoaded();

    await expect(page).toHaveScreenshot('admin-console-light.png', {
      animations: 'disabled',
      mask: [page.locator('table.log-table')],
    });
  });

  test('VIS-09: Visual snapshot of Admin Master Console (Dark Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await adminPage.verifyAdminPageLoaded();

    await adminPage.toggleTheme();
    await adminPage.verifyDarkThemeActive();

    await expect(page).toHaveScreenshot('admin-console-dark.png', {
      animations: 'disabled',
      mask: [page.locator('table.log-table')],
    });
  });

  test('VIS-10: Visual snapshot of Admin Invite User Modal Popup', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await adminPage.verifyAdminPageLoaded();
    await adminPage.openAddUserModal();

    await expect(page).toHaveScreenshot('admin-invite-modal.png', {
      animations: 'disabled',
    });
  });

  // ── 4. Freight Manager Hub & Pipeline Modal ──
  test('VIS-11: Visual snapshot of Freight Manager Hub (Light Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const managerPage = new ManagerPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await page.goto('/manager');
    await managerPage.verifyManagerPageLoaded();

    await expect(page).toHaveScreenshot('manager-hub-light.png', {
      animations: 'disabled',
      mask: [page.locator('table.log-table')],
    });
  });

  test('VIS-12: Visual snapshot of Freight Manager Hub (Dark Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const managerPage = new ManagerPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await page.goto('/manager');
    await managerPage.verifyManagerPageLoaded();

    await managerPage.toggleTheme();
    await managerPage.verifyDarkThemeActive();

    await expect(page).toHaveScreenshot('manager-hub-dark.png', {
      animations: 'disabled',
      mask: [page.locator('table.log-table')],
    });
  });

  // ── 5. Profile & Settings Pages ──
  test('VIS-13: Visual snapshot of Profile Page (Light Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const profilePage = new ProfilePage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await profilePage.navProfile.click();
    await profilePage.verifyProfileLoaded();

    await expect(page).toHaveScreenshot('profile-page-light.png', {
      animations: 'disabled',
    });
  });

  test('VIS-14: Visual snapshot of Profile Page (Dark Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const profilePage = new ProfilePage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await profilePage.navProfile.click();
    await profilePage.verifyProfileLoaded();

    await profilePage.toggleTheme();
    await profilePage.verifyDarkThemeActive();

    await expect(page).toHaveScreenshot('profile-page-dark.png', {
      animations: 'disabled',
    });
  });

  test('VIS-15: Visual snapshot of Settings Page (Light Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const settingsPage = new SettingsPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await settingsPage.navSettings.click();
    await settingsPage.verifySettingsLoaded();

    await expect(page).toHaveScreenshot('settings-page-light.png', {
      animations: 'disabled',
    });
  });

  test('VIS-16: Visual snapshot of Settings Page (Dark Theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const settingsPage = new SettingsPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await settingsPage.navSettings.click();
    await settingsPage.verifySettingsLoaded();

    await settingsPage.toggleTheme();
    await settingsPage.verifyDarkThemeActive();

    await expect(page).toHaveScreenshot('settings-page-dark.png', {
      animations: 'disabled',
    });
  });

  // ── 6. Responsive Visual Snapshots ──
  test('VIS-17: Responsive visual snapshot on Mobile Viewport (375x667 - Light)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();

    await expect(page).toHaveScreenshot('login-mobile-light-375x667.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('VIS-18: Responsive visual snapshot on Mobile Viewport (375x667 - Dark)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();
    await expect(loginPage.loginCard).toBeVisible();

    await expect(page).toHaveScreenshot('login-mobile-dark-375x667.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('VIS-19: Responsive visual snapshot on Tablet Viewport (768x1024 - Light)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();

    await expect(page).toHaveScreenshot('login-tablet-light-768x1024.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('VIS-20: Responsive visual snapshot on Tablet Viewport (768x1024 - Dark)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.toggleTheme();
    await loginPage.verifyDarkThemeActive();
    await expect(loginPage.loginCard).toBeVisible();

    await expect(page).toHaveScreenshot('login-tablet-dark-768x1024.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
