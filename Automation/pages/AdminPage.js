const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class AdminPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.heading = page.locator('h1:has-text("Admin Master Control Center")');
    this.addUserBtn = page.locator('button:has-text("+ Invite / Add User")');
    this.metricsCards = page.locator('.grid-cards .card');

    // Tabs
    this.tabUsers = page.locator('button.tab-btn:has-text("User Management")');
    this.tabOrders = page.locator('button.tab-btn:has-text("Global Orders Master")');
    this.tabAudit = page.locator('button.tab-btn:has-text("Audit Logs")');

    // Tables
    this.usersTable = page.locator('table.log-table');
    this.userRows = page.locator('table.log-table tbody tr');

    // Add User Modal
    this.modal = page.locator('.modal-content');
    this.nameInput = page.locator('.modal-content .form-group:has(label:has-text("Full Name")) input');
    this.emailInput = page.locator('.modal-content .form-group:has(label:has-text("Email Address")) input');
    this.passwordInput = page.locator('.modal-content .form-group:has(label:has-text("Password")) input');
    this.roleSelect = page.locator('.modal-content select');
    this.deptInput = page.locator('.modal-content .form-group:has(label:has-text("Department")) input');
    this.submitUserBtn = page.locator('.modal-content button[type="submit"]');
    this.closeModalBtn = page.locator('.modal-content .close-btn');
  }

  async verifyAdminPageLoaded() {
    await expect(this.page).toHaveURL(/\/admin/, { timeout: 25000 });
    await expect(this.heading).toBeVisible();
    await expect(this.metricsCards).toHaveCount(3);
    await expect(this.addUserBtn).toBeVisible();
  }

  async selectTab(tabName) {
    if (tabName === 'users') await this.tabUsers.click();
    else if (tabName === 'orders') await this.tabOrders.click();
    else if (tabName === 'audit') await this.tabAudit.click();
  }

  async openAddUserModal() {
    await this.addUserBtn.click();
    await expect(this.modal).toBeVisible();
  }

  async createNewUser({ name, email, password, role = 'User', department = 'Operations' }) {
    await this.openAddUserModal();
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.roleSelect.selectOption(role);
    await this.deptInput.fill(department);
    await this.submitUserBtn.click();
    await expect(this.modal).toBeHidden({ timeout: 5000 });
  }

  async changeUserRole(email, newRole) {
    const userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
    await expect(userRow).toBeVisible();
    const roleDropdown = userRow.locator('select.role-select');
    await roleDropdown.selectOption(newRole);
  }

  async toggleUserStatus(email) {
    const userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
    await expect(userRow).toBeVisible();
    const statusBtn = userRow.locator('button[class*="btn-status-"]');
    await statusBtn.click();
  }

  async verifyUserInRoster(email, expectedRole, expectedStatus) {
    const userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
    await expect(userRow).toBeVisible();
    if (expectedRole) {
      await expect(userRow.locator('select.role-select')).toHaveValue(expectedRole);
    }
    if (expectedStatus) {
      await expect(userRow).toContainText(expectedStatus);
    }
  }

  async verifyOrderInMasterTable(trackingId) {
    await this.selectTab('orders');
    const orderRow = this.page.locator(`table tbody tr:has-text("${trackingId}")`);
    await expect(orderRow).toBeVisible();
  }

  async verifyAuditLogsVisible() {
    await this.selectTab('audit');
    await expect(this.page.locator('table.log-table')).toBeVisible();
  }
}

module.exports = { AdminPage };
