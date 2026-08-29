const { test, expect } = require('@playwright/test');
const { RegisterPage } = require('../../pages/auth/RegisterPage');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { DashboardPage } = require('../../pages/customer/DashboardPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('Customer Dashboard & Volumetric Engine Tests', () => {
  let loginPage;
  let registerPage;
  let dashboardPage;
  let customerUser;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    dashboardPage = new DashboardPage(page);

    // Register a fresh customer user
    customerUser = TestDataGenerator.generateUser();
    await registerPage.navigate();
    await registerPage.register(customerUser.name, customerUser.email, customerUser.password, customerUser.password);

    // Login as Customer
    await loginPage.navigate();
    await loginPage.login(customerUser.email, customerUser.password);
    await dashboardPage.verifyDashboardLoaded(customerUser.name);
  });

  test('DASH-01: Should verify customer dashboard metrics cards and empty state on fresh account', async () => {
    await expect(dashboardPage.metricsCards).toHaveCount(3);
  });

  test('DASH-02: Should verify Live Volumetric Pricing Engine calculation preview in order modal', async () => {
    await dashboardPage.openCreateOrderModal();

    // Fill volumetric-dominant package dimensions: (50 x 40 x 30 cm) / 5000 = 12.00 kg volumetric vs 2.0 kg actual
    // Expected Price: Base ($25) + 12kg * $12.50 ($150) + Fragile ($15) + Express ($35) = $225.00
    const expected = TestDataGenerator.calculateExpectedPrice(2.0, 50, 40, 30, true, true);

    await dashboardPage.fillShipmentDetails({
      packageName: 'High-Volume Electronic Sensors',
      origin: 'New Delhi, India',
      destination: 'London, UK',
      quantity: 1,
      weight: 2.0,
      length: 50,
      width: 40,
      height: 30,
      fragile: true,
      express: true,
    });

    await dashboardPage.verifyLiveVolumetricCalculation(expected.volumetricWeight, expected.totalPrice);
  });

  test('DASH-03: Should create a new proxy shipment and verify 7-Stage Pipeline card rendering', async () => {
    const orderData = TestDataGenerator.generateOrderData({
      packageName: 'Aerospace Prototype Samples',
      weight: 3.5,
      length: 25,
      width: 20,
      height: 15,
      fragile: true,
      express: false,
    });

    await dashboardPage.openCreateOrderModal();
    await dashboardPage.fillShipmentDetails(orderData);
    await dashboardPage.submitShipmentOrder();

    // Verify order created and rendered in PICKUP_PENDING stage
    await dashboardPage.verifyOrderCreated(orderData.packageName, 'PICKUP_PENDING');
  });
});
