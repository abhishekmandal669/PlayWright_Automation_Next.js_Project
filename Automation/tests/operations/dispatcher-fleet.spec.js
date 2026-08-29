const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { RegisterPage } = require('../../pages/auth/RegisterPage');
const { DispatcherPage } = require('../../pages/operations/DispatcherPage');
const { DriversPage } = require('../../pages/operations/DriversPage');
const { AdminPage } = require('../../pages/admin/AdminPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('Fleet & Dispatcher Hub Operations Tests', () => {
  let loginPage;
  let registerPage;
  let dispatcherPage;
  let driversPage;
  let adminPage;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    dispatcherPage = new DispatcherPage(page);
    driversPage = new DriversPage(page);
    adminPage = new AdminPage(page);
  });

  test('DISP-01: Dispatcher Hub loads active shipments, stats cards, and map container', async ({ page }) => {
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;

    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);
    await adminPage.verifyAdminPageLoaded();

    await dispatcherPage.navigate();
    await dispatcherPage.verifyDispatcherLoaded();
  });

  test('DISP-02: Register new courier driver and verify table presence on /drivers', async ({ page }) => {
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;
    const driverName = `Courier ${TestDataGenerator.randomString(5)}`;
    const driverEmail = `courier.${TestDataGenerator.randomString(4)}@freightproxy.io`;

    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);

    await driversPage.navigate();
    await driversPage.verifyDriversPageLoaded();

    await driversPage.registerNewDriver({
      name: driverName,
      email: driverEmail,
      phone: '+1 (555) 304-9988',
      license: 'CDL-9982-FL',
      vehicleNum: 'TRK-905',
      vehicleType: 'Heavy Freight',
    });

    await driversPage.verifyDriverInTable(driverName);
  });

  test('DISP-03: Filter drivers by status tabs on /drivers', async ({ page }) => {
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;

    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);

    await driversPage.navigate();
    await driversPage.filterActiveBtn.click();
    await page.waitForTimeout(300);
    await driversPage.filterOffDutyBtn.click();
    await page.waitForTimeout(300);
    await driversPage.filterAllBtn.click();
    await page.waitForTimeout(300);
  });

  test('DISP-04: Standard Customer account cannot access Dispatcher Hub', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();

    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);
    await loginPage.navigate();
    await loginPage.login(customer.email, customer.password);

    await page.goto('http://localhost:3000/dispatcher');
    await expect(page.locator('text="Access Restricted"').or(page.locator('h1:has-text("Welcome Back")'))).toBeVisible({ timeout: 15000 });
  });
});
