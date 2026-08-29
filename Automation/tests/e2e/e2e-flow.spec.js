const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { AdminPage } = require('../../pages/admin/AdminPage');
const { ManagerPage } = require('../../pages/operations/ManagerPage');
const { DashboardPage } = require('../../pages/customer/DashboardPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('Master Multi-Role End-to-End Enterprise Flow', () => {
  test('E2E-01: Full Lifecycle (Admin Creates Staff -> Customer Orders with Volumetric Engine -> Manager Advances Pipeline -> Customer Tracks -> Admin Audits)', async ({ page }) => {
    test.setTimeout(180000);

    const loginPage = new LoginPage(page);
    const adminPage = new AdminPage(page);
    const managerPage = new ManagerPage(page);
    const dashboardPage = new DashboardPage(page);

    const managerUser = TestDataGenerator.generateUser('Manager', 'Linehaul Logistics');
    const customerUser = TestDataGenerator.generateUser('User', 'Quality Assurance');
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;

    // ─────────────────────────────────────────────────────────
    // Phase 1: SuperAdmin Invites/Creates Manager and Customer
    // ─────────────────────────────────────────────────────────
    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);
    await adminPage.verifyAdminPageLoaded();

    // Create Manager
    await adminPage.createNewUser({
      name: managerUser.name,
      email: managerUser.email,
      password: managerUser.password,
      role: 'Manager',
      department: managerUser.department,
    });
    await adminPage.verifyUserInRoster(managerUser.email, 'Manager', 'Active');

    // Create Customer
    await adminPage.createNewUser({
      name: customerUser.name,
      email: customerUser.email,
      password: customerUser.password,
      role: 'User',
      department: customerUser.department,
    });
    await adminPage.verifyUserInRoster(customerUser.email, 'User', 'Active');

    // SuperAdmin Logs Out
    await adminPage.logout();

    // ─────────────────────────────────────────────────────────
    // Phase 2: Customer Logs In & Places Volumetric Shipment
    // ─────────────────────────────────────────────────────────
    await loginPage.navigate();
    await loginPage.login(customerUser.email, customerUser.password);
    await dashboardPage.verifyDashboardLoaded(customerUser.name);

    const timestamp = Date.now();
    const orderData = TestDataGenerator.generateOrderData({
      packageName: `Fiber-Optic Sensor Modules (E2E ${timestamp})`,
      weight: 3.0,
      length: 40,
      width: 30,
      height: 25,
      fragile: true,
      express: true,
    });

    await dashboardPage.openCreateOrderModal();
    await dashboardPage.fillShipmentDetails(orderData);
    await dashboardPage.submitShipmentOrder();

    // Verify order rendered in Stage 1: PICKUP_PENDING
    await dashboardPage.verifyOrderCreated(orderData.packageName, 'PICKUP_PENDING');

    // Customer Logs Out
    await dashboardPage.logout();

    // ─────────────────────────────────────────────────────────
    // Phase 3: Manager Processes Shipment in Dispatch Hub
    // ─────────────────────────────────────────────────────────
    await loginPage.navigate();
    await loginPage.login(managerUser.email, managerUser.password);
    await managerPage.verifyManagerPageLoaded();

    // Advance Stage to PICKUP_SCHEDULED
    await managerPage.advanceOrderStage(orderData.packageName, 'PICKUP_SCHEDULED');
    await managerPage.verifyOrderStatusInTable(orderData.packageName, 'PICKUP_SCHEDULED');

    // Manager Logs Out
    await managerPage.logout();

    // ─────────────────────────────────────────────────────────
    // Phase 4: Customer Tracks Live 7-Stage Stepper Progress
    // ─────────────────────────────────────────────────────────
    await loginPage.navigate();
    await loginPage.login(customerUser.email, customerUser.password);
    await dashboardPage.verifyDashboardLoaded(customerUser.name);

    // Verify updated status visible to Customer
    await dashboardPage.verifyOrderCreated(orderData.packageName, 'PICKUP_SCHEDULED');

    // Customer Logs Out
    await dashboardPage.logout();

    // ─────────────────────────────────────────────────────────
    // Phase 5: SuperAdmin Inspects Global Master Orders
    // ─────────────────────────────────────────────────────────
    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);
    await adminPage.verifyAdminPageLoaded();

    // Verify order in Master Orders table
    await adminPage.selectTab('orders');
    await expect(adminPage.page.locator(`table tbody tr:has-text("${orderData.packageName}")`).first()).toBeVisible();

    // Final Logout
    await adminPage.logout();
  });
});
