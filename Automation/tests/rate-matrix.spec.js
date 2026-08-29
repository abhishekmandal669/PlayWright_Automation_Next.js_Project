const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Admin Dynamic Rate Matrix Engine Tests', () => {
  let loginPage;
  let registerPage;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
  });

  test('RATE-01: Admin can retrieve and update global Rate Matrix via API', async ({ page }) => {
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;

    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);

    // GET /api/admin/rates
    const getRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/rates', { credentials: 'include' });
      return { status: res.status, data: await res.json() };
    });
    expect(getRes.status).toBe(200);
    expect(getRes.data.success).toBeTruthy();
    expect(getRes.data.rates).toBeDefined();

    // PATCH /api/admin/rates
    const patchRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          basePrice: 25.0,
          pricePerKg: 12.5,
          fragileFee: 15.0,
          expressFee: 35.0,
        }),
      });
      return { status: res.status, data: await res.json() };
    });
    expect(patchRes.status).toBe(200);
    expect(patchRes.data.success).toBeTruthy();
  });

  test('RATE-02: Non-admin caller receives 403 Forbidden on rate configuration', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();

    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);
    await loginPage.navigate();
    await loginPage.login(customer.email, customer.password);

    // Attempt to modify rates as non-admin
    const patchRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          basePrice: 100.0,
        }),
      });
      return { status: res.status };
    });
    expect(patchRes.status).toBe(403);
  });
});
