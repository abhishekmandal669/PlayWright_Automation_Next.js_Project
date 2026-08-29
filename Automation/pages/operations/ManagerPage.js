const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');

class ManagerPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.heading = page.locator('h1:has-text("Manager Operations")');
    this.metricsCards = page.locator('.paper-card');

    // Tabs
    this.tabPipeline = page.locator('button:has-text("Freight Operations Pipeline")');
    this.tabRoster = page.locator('button:has-text("Customer & Staff Roster")');

    // Operations Table
    this.ordersTable = page.locator('table.specs-paper, table');
    this.orderRows = page.locator('table tbody tr');

    // Pipeline Modal
    this.modal = page.locator('div.fixed.inset-0:has(h2:has-text("Advance Shipment Pipeline Stage"))');
    this.stageSelect = page.locator('div.fixed.inset-0 select');
    this.updatePipelineBtn = page.locator('div.fixed.inset-0 button[type="submit"]');
  }

  async verifyManagerPageLoaded() {
    await expect(this.page).toHaveURL(/\/manager/, { timeout: 25000 });
    await expect(this.heading).toBeVisible({ timeout: 20000 });
    await expect(this.tabPipeline).toBeVisible({ timeout: 20000 });
    await expect(this.tabRoster).toBeVisible({ timeout: 20000 });
  }

  async selectTab(tabName) {
    if (tabName === 'pipeline') await this.tabPipeline.click();
    else if (tabName === 'roster') await this.tabRoster.click();
    await this.page.waitForTimeout(300);
  }

  async advanceOrderStage(trackingIdOrPkg, newStageValue) {
    const orderRow = this.page.locator(`table tbody tr:has-text("${trackingIdOrPkg}")`).first();
    await expect(orderRow).toBeVisible({ timeout: 15000 });
    await orderRow.locator('button:has-text("Stage"), button[title="Update Dispatch Stage"]').click();

    await expect(this.modal).toBeVisible({ timeout: 10000 });
    await this.stageSelect.selectOption(newStageValue);
    await this.updatePipelineBtn.click();
    await expect(this.modal).toBeHidden({ timeout: 15000 }).catch(async () => {
      const closeBtn = this.page.locator('div.fixed.inset-0 button:has-text("✕")').first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    });
  }

  async verifyOrderStatusInTable(trackingIdOrPkg, expectedStatus) {
    const orderRow = this.page.locator(`table tbody tr:has-text("${trackingIdOrPkg}")`).first();
    await expect(orderRow).toBeVisible({ timeout: 15000 });
    const normalized = expectedStatus.replace(/_/g, ' ');
    await expect(orderRow).toContainText(normalized, { ignoreCase: true });
  }
}

module.exports = { ManagerPage };
