const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Global Audit & CSV Export Tests', () => {
  let loginPage;
  let registerPage;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
  });

  test('EXP-01: Admin can export global shipments manifest to CSV via /api/admin/export', async ({ page }) => {
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;

    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);

    const exportRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/export', { credentials: 'include' });
      return {
        status: res.status,
        contentType: res.headers.get('content-type'),
        text: await res.text(),
      };
    });

    expect(exportRes.status).toBe(200);
    expect(exportRes.contentType).toContain('text/csv');
    expect(exportRes.text).toBeDefined();
  });

  test('EXP-02: Regular customer receives 403 Forbidden on CSV export endpoint', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();

    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);
    await loginPage.navigate();
    await loginPage.login(customer.email, customer.password);

    const exportRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/export', { credentials: 'include' });
      return { status: res.status };
    });

    expect(exportRes.status).toBe(403);
  });
});
