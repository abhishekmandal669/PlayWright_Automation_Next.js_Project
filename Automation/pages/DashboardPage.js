const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class DashboardPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.welcomeHeading = page.locator('#welcome-heading');
    this.roleBadge = page.locator('#user-role-badge');
    this.logoutBtn = page.locator('#logout-btn');
    this.cards = page.locator('.card');

    // New Activity Panel Locators
    this.activityPanel = page.locator('.activity-panel');
    this.statusPill = page.locator('.status-pill');
    this.logTable = page.locator('.log-table');
    this.logRows = page.locator('.log-table tbody tr');
  }

  async verifyDashboardLoaded(userName) {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(this.welcomeHeading).toBeVisible();
    if (userName) {
      await expect(this.welcomeHeading).toContainText(userName);
    }
    await expect(this.logoutBtn).toBeVisible();
    await expect(this.cards).toHaveCount(3);
  }

  async verifyActivityMonitor() {
    await expect(this.activityPanel).toBeVisible();
    await expect(this.statusPill).toContainText('Latency:');
    await expect(this.logTable).toBeVisible();
    await expect(this.logRows).toHaveCount(4);
  }

  async logout() {
    await this.logoutBtn.click();
    await expect(this.page).toHaveURL(/\//, { timeout: 10000 });
  }
}

module.exports = { DashboardPage };
