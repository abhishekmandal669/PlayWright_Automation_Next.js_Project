const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { RegisterPage } = require('../../pages/auth/RegisterPage');
const { DashboardPage } = require('../../pages/customer/DashboardPage');
const { AdminPage } = require('../../pages/admin/AdminPage');
const { ManagerPage } = require('../../pages/operations/ManagerPage');
const { ProfilePage } = require('../../pages/customer/ProfilePage');
const { SettingsPage } = require('../../pages/customer/SettingsPage');
const { CreateOrderStudioPage } = require('../../pages/operations/CreateOrderStudioPage');
const { DispatcherPage } = require('../../pages/operations/DispatcherPage');
const { DriversPage } = require('../../pages/operations/DriversPage');
const { ForgotPasswordPage } = require('../../pages/auth/ForgotPasswordPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('Visual Regression & UI Snapshot Tests', () => {
  // ── 1. Auth Pages Snapshots ──
  test('VIS-01: Visual snapshot of Login Page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();

    await expect(page).toHaveScreenshot('login-page-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('VIS-02: Visual snapshot of Register Page', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();
    await expect(registerPage.registerCard).toBeVisible();

    await expect(page).toHaveScreenshot('register-page-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // ── 2. Customer Dashboard & Create Order Modal ──
  test('VIS-03: Visual snapshot of Customer Dashboard', async ({ page }) => {
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

  test('VIS-04: Visual snapshot of Create Order Modal Popup', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    const user = TestDataGenerator.generateUser();
    await registerPage.navigate();
    await registerPage.register(user.name, user.email, user.password, user.password);

    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await dashboardPage.verifyDashboardLoaded(user.name);
    await dashboardPage.openCreateOrderModal();

    await expect(page).toHaveScreenshot('create-order-modal.png', {
      animations: 'disabled',
    });
  });

  // ── 3. Admin Master Console & Invite Modal ──
  test('VIS-05: Visual snapshot of Admin Master Console', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await adminPage.verifyAdminPageLoaded();

    await expect(page).toHaveScreenshot('admin-console-light.png', {
      animations: 'disabled',
      mask: [page.locator('table')],
    });
  });

  test('VIS-06: Visual snapshot of Admin Invite User Modal Popup', async ({ page }) => {
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

  // ── 4. Freight Manager Hub ──
  test('VIS-07: Visual snapshot of Freight Manager Hub', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const managerPage = new ManagerPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await managerPage.navigateTo('/manager');
    await managerPage.verifyManagerPageLoaded();

    await expect(page).toHaveScreenshot('manager-hub-light.png', {
      animations: 'disabled',
      mask: [page.locator('table')],
    });
  });

  // ── 5. Profile & Settings Pages ──
  test('VIS-08: Visual snapshot of Profile Page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const profilePage = new ProfilePage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await profilePage.navigateTo('/profile');
    await profilePage.verifyProfileLoaded();

    await expect(page).toHaveScreenshot('profile-page-light.png', {
      animations: 'disabled',
    });
  });

  test('VIS-09: Visual snapshot of Settings Page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const settingsPage = new SettingsPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await settingsPage.navigateTo('/settings');
    await settingsPage.verifySettingsLoaded();

    await expect(page).toHaveScreenshot('settings-page-light.png', {
      animations: 'disabled',
    });
  });

  // ── 6. New Features: Order Creation Studio, Dispatcher, Drivers, Password Reset ──
  test('VIS-12: Visual snapshot of Order Creation Studio', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const studioPage = new CreateOrderStudioPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await studioPage.navigate();

    await expect(page).toHaveScreenshot('order-creation-studio.png', {
      animations: 'disabled',
    });
  });

  test('VIS-13: Visual snapshot of Dispatcher Staging Hub', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dispatcherPage = new DispatcherPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await dispatcherPage.navigate();
    await dispatcherPage.verifyDispatcherLoaded();

    await expect(page).toHaveScreenshot('dispatcher-staging-hub.png', {
      animations: 'disabled',
      mask: [page.locator('#dispatcher-map-container, .leaflet-container')],
    });
  });

  test('VIS-14: Visual snapshot of Fleet & Drivers Operations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const driversPage = new DriversPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await driversPage.navigate();
    await driversPage.verifyDriversPageLoaded();

    await expect(page).toHaveScreenshot('fleet-drivers-page.png', {
      animations: 'disabled',
      mask: [page.locator('table')],
    });
  });

  test('VIS-15: Visual snapshot of Forgot Password Security Page', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.navigate();
    await expect(forgotPasswordPage.emailInput).toBeVisible();

    await expect(page).toHaveScreenshot('forgot-password-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // ── 7. Responsive Visual Snapshots ──
  test('VIS-10: Responsive visual snapshot on Mobile Viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();

    await expect(loginPage.loginCard).toHaveScreenshot('login-mobile-card.png', {
      animations: 'disabled',
    });
  });

  test('VIS-11: Responsive visual snapshot on Tablet Viewport (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await expect(loginPage.loginCard).toBeVisible();

    await expect(loginPage.loginCard).toHaveScreenshot('login-tablet-card.png', {
      animations: 'disabled',
    });
  });
});
