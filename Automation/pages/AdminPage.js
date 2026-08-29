const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class AdminPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.heading = page.locator('h1:has-text("SuperAdmin Master Console"), h1:has-text("Admin")');
    this.addUserBtn = page.locator('#provision-user-btn, button:has-text("+ Provision Staff")');
    this.metricsCards = page.locator('.paper-card');

    // Tabs
    this.tabAnalytics = page.locator('button:has-text("Revenue & BI Analytics")');
    this.tabUsers = page.locator('button:has-text("User Access & RBAC")');
    this.tabOrders = page.locator('button:has-text("Global Shipments")');
    this.tabRates = page.locator('button:has-text("Rate Matrix Configurator")');

    // User Table
    this.usersTable = page.locator('table.specs-paper, table');
    this.userRows = page.locator('table tbody tr');

    // Provision User Modal
    this.modal = page.locator('#provision-user-modal, div[style*="fixed"]:has(h3:has-text("Provision Operations Staff"))');
    this.nameInput = page.locator('#provision-user-modal input[type="text"], div[style*="fixed"] input[type="text"]').first();
    this.emailInput = page.locator('#provision-user-modal input[type="email"], div[style*="fixed"] input[type="email"]');
    this.passwordInput = page.locator('#provision-user-modal input[type="password"], div[style*="fixed"] input[type="password"]');
    this.roleSelect = page.locator('#provision-user-modal select, div[style*="fixed"] select');
    this.deptInput = page.locator('#provision-user-modal input[type="text"], div[style*="fixed"] input[type="text"]').last();
    this.submitUserBtn = page.locator('#provision-user-modal button[type="submit"], button:has-text("Provision Account")');
  }

  async verifyAdminPageLoaded() {
    await expect(this.page).toHaveURL(/\/admin/, { timeout: 25000 });
    await expect(this.heading).toBeVisible({ timeout: 20000 });
    await expect(this.addUserBtn).toBeVisible({ timeout: 20000 });
  }

  async selectTab(tabName) {
    if (tabName === 'users') await this.tabUsers.click();
    else if (tabName === 'orders') await this.tabOrders.click();
    else if (tabName === 'rates') await this.tabRates.click();
    else if (tabName === 'analytics') await this.tabAnalytics.click();
    await this.page.waitForTimeout(300);
  }

  async openAddUserModal() {
    await this.addUserBtn.click();
    await expect(this.modal).toBeVisible({ timeout: 10000 });
  }

  async createNewUser({ name, email, password, role = 'User', department = 'Operations' }) {
    await this.openAddUserModal();
    await this.safeFill(this.nameInput, name);
    await this.safeFill(this.emailInput, email);
    await this.safeFill(this.passwordInput, password);
    await this.roleSelect.selectOption(role);
    if (department) await this.safeFill(this.deptInput, department);
    await this.page.waitForTimeout(100);
    await this.submitUserBtn.click();
    await expect(this.modal).toBeHidden({ timeout: 15000 });
    await this.page.waitForTimeout(500);
  }

  async findUserRow(email) {
    await this.selectTab('users');
    let userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
    let isVisible = await userRow.isVisible().catch(() => false);
    if (!isVisible) {
      const pageSizeDropdown = this.page.locator('select:has(option:has-text("100 entries")), select:has(option:has-text("entries"))').first();
      if (await pageSizeDropdown.isVisible()) {
        await pageSizeDropdown.selectOption('100');
        await this.page.waitForTimeout(800);
      }
      userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
      isVisible = await userRow.isVisible().catch(() => false);
      if (!isVisible) {
        const nextBtn = this.page.locator('button:has-text("Next →")');
        while (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
          await nextBtn.click();
          await this.page.waitForTimeout(500);
          userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
          if (await userRow.isVisible().catch(() => false)) break;
        }
      }
    }
    userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
    await expect(userRow).toBeVisible({ timeout: 10000 });
    return userRow;
  }

  async changeUserRole(email, newRole) {
    const userRow = await this.findUserRow(email);
    const roleDropdown = userRow.locator('select.sort-select, select');
    await roleDropdown.selectOption(newRole);
    await this.page.waitForTimeout(500);
  }

  async toggleUserStatus(email) {
    const userRow = await this.findUserRow(email);
    const statusBtn = userRow.locator('button.btn-paper, button');
    await statusBtn.click();
    await this.page.waitForTimeout(500);
  }

  async verifyUserInRoster(email, expectedRole, expectedStatus) {
    const userRow = await this.findUserRow(email);
    if (expectedRole) {
      await expect(userRow.locator('select.sort-select, select')).toHaveValue(expectedRole);
    }
    if (expectedStatus) {
      await expect(userRow).toContainText(expectedStatus);
    }
  }

  async verifyOrderInMasterTable(trackingId) {
    await this.selectTab('orders');
    const orderRow = this.page.locator(`table tbody tr:has-text("${trackingId}")`);
    await expect(orderRow).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { AdminPage };
