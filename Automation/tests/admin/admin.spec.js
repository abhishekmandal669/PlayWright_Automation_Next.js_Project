const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { AdminPage } = require('../../pages/admin/AdminPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('SuperAdmin Master Console Tests', () => {
  let loginPage;
  let adminPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    adminPage = new AdminPage(page);

    await loginPage.navigate();
    await loginPage.login(TestDataGenerator.superAdmin.email, TestDataGenerator.superAdmin.password);
    await adminPage.verifyAdminPageLoaded();
  });

  test('ADM-01: SuperAdmin console loads metrics cards, tabs, and analytics', async () => {
    await expect(adminPage.heading).toBeVisible();
    await expect(adminPage.tabAnalytics).toBeVisible();
    await expect(adminPage.tabUsers).toBeVisible();
    await expect(adminPage.tabOrders).toBeVisible();
    await expect(adminPage.tabRates).toBeVisible();
  });

  test('ADM-02: SuperAdmin can provision a new operations staff member', async () => {
    const newStaff = TestDataGenerator.generateUser('Manager', 'Linehaul Logistics');
    await adminPage.createNewUser({
      name: newStaff.name,
      email: newStaff.email,
      password: newStaff.password,
      role: 'Manager',
      department: newStaff.department,
    });

    await adminPage.verifyUserInRoster(newStaff.email, 'Manager', 'Active');
  });

  test('ADM-03: SuperAdmin can switch between tabs', async () => {
    await adminPage.selectTab('users');
    await expect(adminPage.usersTable).toBeVisible();

    await adminPage.selectTab('orders');
    await expect(adminPage.page.locator('table')).toBeVisible();

    await adminPage.selectTab('rates');
    await expect(adminPage.page.locator('form')).toBeVisible();

    await adminPage.selectTab('analytics');
    await expect(adminPage.heading).toBeVisible();
  });
});
