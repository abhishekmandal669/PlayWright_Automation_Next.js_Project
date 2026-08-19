const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { AdminPage } = require('../pages/AdminPage');
const { ManagerPage } = require('../pages/ManagerPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Manager Freight & Dispatch Operations Hub Tests', () => {
  let loginPage;
  let adminPage;
  let managerPage;
  let managerUser;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    adminPage = new AdminPage(page);
    managerPage = new ManagerPage(page);

    // Step 1: Login as SuperAdmin and create a dedicated Manager account
    managerUser = TestDataGenerator.generateUser('Manager', 'Dispatch Operations');
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;

    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);
    await adminPage.verifyAdminPageLoaded();
    await adminPage.createNewUser({
      name: managerUser.name,
      email: managerUser.email,
      password: managerUser.password,
      role: 'Manager',
      department: managerUser.department,
    });
    await adminPage.logout();

    // Step 2: Login as Manager
    await loginPage.navigate();
    await loginPage.login(managerUser.email, managerUser.password);
    await managerPage.verifyManagerPageLoaded();
  });

  test('MGR-01: Should display Manager stats cards and operations tabs', async () => {
    await expect(managerPage.metricsCards).toHaveCount(3);
    await expect(managerPage.tabPipeline).toBeVisible();
    await expect(managerPage.tabRoster).toBeVisible();
  });

  test('MGR-02: Should advance 7-stage shipment pipeline status and edit order specs', async ({ page }) => {
    // Step A: Register a customer and place an order
    const customerUser = TestDataGenerator.generateUser();
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);

    await managerPage.logout();
    await registerPage.navigate();
    await registerPage.register(customerUser.name, customerUser.email, customerUser.password, customerUser.password);
    await registerPage.verifySuccessBanner('Account created successfully');

    await loginPage.navigate();
    await loginPage.login(customerUser.email, customerUser.password);
    await dashboardPage.verifyDashboardLoaded(customerUser.name);

    const orderData = TestDataGenerator.generateOrderData({
      packageName: 'Precision Turbine Blade Prototypes',
      weight: 5.0,
      length: 35,
      width: 25,
      height: 20,
    });
    await dashboardPage.openCreateOrderModal();
    await dashboardPage.fillShipmentDetails(orderData);
    await dashboardPage.submitShipmentOrder();
    await dashboardPage.verifyOrderCreated(orderData.packageName);
    await dashboardPage.logout();

    // Step B: Manager logs back in to advance pipeline stage
    await loginPage.navigate();
    await loginPage.login(managerUser.email, managerUser.password);
    await managerPage.verifyManagerPageLoaded();

    // Advance Stage to RECEIVED_AT_WAREHOUSE
    await managerPage.advanceOrderStage(orderData.packageName, 'RECEIVED_AT_WAREHOUSE');
    await managerPage.verifyOrderStatusInTable(orderData.packageName, 'RECEIVED_AT_WAREHOUSE');

    // Edit Order Specs
    await managerPage.editOrderSpecs(orderData.packageName, {
      origin: 'Bengaluru Logistics Hub, India',
      destination: 'Frankfurt Airport Hub, Germany',
      price: 285.50,
    });

    // Step C: Verify roster view
    await managerPage.selectTab('roster');
    await expect(managerPage.page.locator('table.log-table')).toBeVisible();
  });
});
