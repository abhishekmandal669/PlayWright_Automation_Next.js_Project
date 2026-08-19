const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { AdminPage } = require('../pages/AdminPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Admin Master Center & Organization Control Tests', () => {
  let loginPage;
  let adminPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    adminPage = new AdminPage(page);

    // Login as SuperAdmin
    const { email, password } = TestDataGenerator.superAdmin;
    await loginPage.navigate();
    await loginPage.login(email, password);
    await adminPage.verifyAdminPageLoaded();
  });

  test('ADM-01: Should display Admin metrics cards and tabs', async () => {
    await expect(adminPage.metricsCards).toHaveCount(3);
    await expect(adminPage.tabUsers).toBeVisible();
    await expect(adminPage.tabOrders).toBeVisible();
    await expect(adminPage.tabAudit).toBeVisible();
  });

  test('ADM-02: Should invite / create a new Manager user account from modal', async () => {
    const newManager = TestDataGenerator.generateUser('Manager', 'Logistics Operations');

    await adminPage.createNewUser({
      name: newManager.name,
      email: newManager.email,
      password: newManager.password,
      role: 'Manager',
      department: newManager.department,
    });

    // Verify Manager appears in the user roster table
    await adminPage.verifyUserInRoster(newManager.email, 'Manager', 'Active');
  });

  test('ADM-03: Should change user role inline using dropdown selector', async () => {
    const testUser = TestDataGenerator.generateUser('User', 'QA Operations');

    await adminPage.createNewUser({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      role: 'User',
      department: testUser.department,
    });

    // Promote to Manager
    await adminPage.changeUserRole(testUser.email, 'Manager');
    await adminPage.verifyUserInRoster(testUser.email, 'Manager', null);
  });

  test('ADM-04: Should toggle user account status between Active and Suspended', async () => {
    const testUser = TestDataGenerator.generateUser('User', 'Finance Operations');

    await adminPage.createNewUser({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      role: 'User',
      department: testUser.department,
    });

    // Toggle to Suspended
    await adminPage.toggleUserStatus(testUser.email);
    await adminPage.verifyUserInRoster(testUser.email, null, 'Suspended');

    // Toggle back to Active
    await adminPage.toggleUserStatus(testUser.email);
    await adminPage.verifyUserInRoster(testUser.email, null, 'Active');
  });

  test('ADM-05: Should inspect Global Master Orders and Real-Time Security Audit Trail tabs', async () => {
    await adminPage.selectTab('orders');
    await expect(adminPage.page.locator('table.log-table')).toBeVisible();

    await adminPage.selectTab('audit');
    await expect(adminPage.page.locator('table.log-table')).toBeVisible();
  });
});
