const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { CreateOrderStudioPage } = require('../pages/CreateOrderStudioPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { AdminPage } = require('../pages/AdminPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Freight Order Creation Studio & Auto-Provisioning Tests', () => {
  let loginPage;
  let registerPage;
  let studioPage;
  let dashboardPage;
  let adminPage;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    studioPage = new CreateOrderStudioPage(page);
    dashboardPage = new DashboardPage(page);
    adminPage = new AdminPage(page);
  });

  test('STU-01: Customer creates shipment via Studio using Preset Carton Dimensions', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();

    // Register & Login as customer
    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);
    await loginPage.navigate();
    await loginPage.login(customer.email, customer.password);
    await dashboardPage.verifyDashboardLoaded(customer.name);

    // Navigate to Creation Studio
    await studioPage.navigate();
    await studioPage.selectPreset('standard');

    // Verify Standard Carton dimensions loaded (40x30x20, 4.5kg)
    await expect(studioPage.lengthInput).toHaveValue('40');
    await expect(studioPage.widthInput).toHaveValue('30');
    await expect(studioPage.heightInput).toHaveValue('20');

    // Fill Package Details & Submit
    const orderTitle = `Studio Standard Carton - ${TestDataGenerator.randomString(5)}`;
    await studioPage.fillPackageDetails({
      packageName: orderTitle,
      origin: 'Tokyo, Japan',
      destination: 'San Francisco, USA',
    });

    await studioPage.submitShipment();
    await studioPage.verifySuccessAlert();

    // Verify redirected and order visible in dashboard
    await dashboardPage.verifyDashboardLoaded(customer.name);
    await dashboardPage.verifyOrderCreated(orderTitle);
  });

  test('STU-02: Live Volumetric calculation preview in sticky gauge', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();

    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);
    await loginPage.navigate();
    await loginPage.login(customer.email, customer.password);

    await studioPage.navigate();
    await studioPage.selectPreset('custom');

    // Custom dimensions: 50x40x30 cm, 2.0 kg
    // Volumetric weight = (50 * 40 * 30) / 5000 = 12.0 kg
    // Chargeable weight = max(2.0, 12.0) = 12 kg
    await studioPage.fillDimensions({
      length: 50,
      width: 40,
      height: 30,
      weight: 2.0,
    });

    await expect(studioPage.chargeableWeightGauge).toContainText('12');
  });

  test('STU-03: Manager creates shipment on behalf of existing customer (Mode A)', async ({ page }) => {
    // Phase 1: Register Customer Account
    const customer = TestDataGenerator.generateUser();
    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);

    // Phase 2: SuperAdmin creates Manager
    const manager = TestDataGenerator.generateUser('Manager', 'Freight Ops');
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;
    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);
    await adminPage.verifyAdminPageLoaded();
    await adminPage.createNewUser({
      name: manager.name,
      email: manager.email,
      password: manager.password,
      role: 'Manager',
      department: manager.department,
    });
    await adminPage.logout();

    // Phase 3: Manager logs in and creates order on behalf of customer
    await loginPage.navigate();
    await loginPage.login(manager.email, manager.password);

    await studioPage.navigate();
    await studioPage.selectExistingCustomer(customer.email);

    const onBehalfPkg = `Manager On-Behalf Cargo - ${TestDataGenerator.randomString(5)}`;
    await studioPage.fillPackageDetails({
      packageName: onBehalfPkg,
      origin: 'Munich, Germany',
      destination: 'Chicago, USA',
    });
    await studioPage.submitShipment();
    await studioPage.verifySuccessAlert();
    await page.waitForTimeout(1500);

    // Phase 4: Customer logs in and verifies order appears in their personal dashboard
    await loginPage.navigate();
    await loginPage.login(customer.email, customer.password);
    await dashboardPage.verifyDashboardLoaded(customer.name);
    await dashboardPage.verifyOrderCreated(onBehalfPkg);
  });

  test('STU-04: Admin creates shipment on behalf of new customer with auto-provisioning (Mode B)', async ({ page }) => {
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;
    const newCustomer = TestDataGenerator.generateUser();

    // SuperAdmin logs in
    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);
    await adminPage.verifyAdminPageLoaded();

    // Navigate to Studio and fill Mode B new customer
    await studioPage.navigate();
    await studioPage.fillNewCustomerDetails({
      name: newCustomer.name,
      email: newCustomer.email,
      phone: '+1 (555) 987-6543',
    });

    const autoProvisionPkg = `Auto Provisioned Package - ${TestDataGenerator.randomString(5)}`;
    await studioPage.fillPackageDetails({
      packageName: autoProvisionPkg,
      origin: 'Dubai, UAE',
      destination: 'Singapore',
    });

    await studioPage.submitShipment();
    await studioPage.verifySuccessAlert();
  });
});
