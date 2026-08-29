const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/auth/LoginPage');
const { AdminPage } = require('../../pages/admin/AdminPage');
const { RegisterPage } = require('../../pages/auth/RegisterPage');
const { DashboardPage } = require('../../pages/customer/DashboardPage');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('Role-Based Access Control (RBAC) & Route Guard Tests', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('RBAC-01: Unauthenticated direct URL navigation to protected routes redirects to Login', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/admin', '/manager', '/profile', '/settings'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\//, { timeout: 10000 });
      await expect(loginPage.loginCard).toBeVisible();
    }
  });

  test('RBAC-02: Standard Customer account cannot access Admin or Manager consoles and is redirected to Dashboard', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);
    const customer = TestDataGenerator.generateUser();

    // Register & Login as customer
    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);

    await loginPage.navigate();
    await loginPage.login(customer.email, customer.password);
    await dashboardPage.verifyDashboardLoaded(customer.name);

    // Attempt direct access to /admin -> redirected to /dashboard
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Attempt direct access to /manager -> redirected to /dashboard
    await page.goto('/manager');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('RBAC-03: Suspended user account cannot log in and receives account suspended alert', async ({ page }) => {
    const adminPage = new AdminPage(page);
    const suspendedUser = TestDataGenerator.generateUser();
    const { email: adminEmail, password: adminPassword } = TestDataGenerator.superAdmin;

    // Login as SuperAdmin to create & suspend user
    await loginPage.navigate();
    await loginPage.login(adminEmail, adminPassword);
    await adminPage.verifyAdminPageLoaded();

    await adminPage.createNewUser({
      name: suspendedUser.name,
      email: suspendedUser.email,
      password: suspendedUser.password,
      role: 'User',
      department: 'Compliance',
    });

    // Suspend user
    await adminPage.toggleUserStatus(suspendedUser.email);
    await adminPage.verifyUserInRoster(suspendedUser.email, null, 'Suspended');
    await adminPage.logout();

    // Attempt login as suspended user
    await loginPage.navigate();
    await loginPage.login(suspendedUser.email, suspendedUser.password);
    await loginPage.verifyErrorBanner('suspended');
  });
});
