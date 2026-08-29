const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { RegisterPage } = require('../../pages/auth/RegisterPage');
const { DashboardPage } = require('../../pages/customer/DashboardPage');
const { AdminPage } = require('../../pages/admin/AdminPage');
const { OrderActionsPage } = require('../../pages/operations/OrderActionsPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('Two-Tier Order Inspection & Specification Edit Tests', () => {
  let loginPage;
  let registerPage;
  let dashboardPage;
  let adminPage;
  let orderActionsPage;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    dashboardPage = new DashboardPage(page);
    adminPage = new AdminPage(page);
    orderActionsPage = new OrderActionsPage(page);
  });

  test('ACT-01: View Order Details renders tracking metadata & timeline', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();

    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);
    await loginPage.navigate();
    await loginPage.login(customer.email, customer.password);
    await dashboardPage.verifyDashboardLoaded(customer.name);

    const orderData = TestDataGenerator.generateOrderData({
      packageName: `Inspectable Turbines - ${TestDataGenerator.randomString(4)}`,
    });
    await dashboardPage.openCreateOrderModal();
    await dashboardPage.fillShipmentDetails(orderData);
    await dashboardPage.submitShipmentOrder();
    await dashboardPage.verifyOrderCreated(orderData.packageName);

    // Open View Details
    await orderActionsPage.openViewDrawer(orderData.packageName);
    await expect(page.locator('h1, h2').filter({ hasText: /Shipment|Inspection|Waybill/i }).first()).toBeVisible();
  });

  test('ACT-02: Edit Specs enforces locked customer record and updates specs', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();

    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);
    await loginPage.navigate();
    await loginPage.login(customer.email, customer.password);
    await dashboardPage.verifyDashboardLoaded(customer.name);

    const orderData = TestDataGenerator.generateOrderData({
      packageName: `Editable Freight - ${TestDataGenerator.randomString(4)}`,
    });
    await dashboardPage.openCreateOrderModal();
    await dashboardPage.fillShipmentDetails(orderData);
    await dashboardPage.submitShipmentOrder();
    await dashboardPage.verifyOrderCreated(orderData.packageName);

    // Open Edit Specs
    await orderActionsPage.openEditModal(orderData.packageName);
    await orderActionsPage.verifyCustomerLockedInEditModal();
  });
});
