const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class ManagerPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.heading = page.locator('h1:has-text("Manager Freight & Dispatch")');
    this.metricsCards = page.locator('.grid-cards .card');

    // Tabs
    this.tabPipeline = page.locator('button.tab-btn:has-text("Freight Operations Pipeline")');
    this.tabRoster = page.locator('button.tab-btn:has-text("Customer & Staff Roster")');

    // Operations Table
    this.ordersTable = page.locator('table.log-table');
    this.orderRows = page.locator('table.log-table tbody tr');

    // Modals
    this.modal = page.locator('.modal-content');
    this.stageSelect = page.locator('.modal-content select');
    this.updatePipelineBtn = page.locator('.modal-content button:has-text("Update Pipeline")');
    this.updateSpecsBtn = page.locator('.modal-content button:has-text("Update Specs")');
    this.editOriginInput = page.locator('.modal-content .form-group:has(label:has-text("Origin Location")) input');
    this.editDestInput = page.locator('.modal-content .form-group:has(label:has-text("Destination Address")) input');
    this.editPriceInput = page.locator('.modal-content .form-group:has(label:has-text("Total Shipping Price")) input');
  }

  async verifyManagerPageLoaded() {
    await expect(this.page).toHaveURL(/\/manager/, { timeout: 25000 });
    await expect(this.heading).toBeVisible();
    await expect(this.metricsCards).toHaveCount(3);
  }

  async selectTab(tabName) {
    if (tabName === 'pipeline') await this.tabPipeline.click();
    else if (tabName === 'roster') await this.tabRoster.click();
  }

  async advanceOrderStage(trackingIdOrPkg, newStageValue) {
    const orderRow = this.page.locator(`table tbody tr:has-text("${trackingIdOrPkg}")`).first();
    await expect(orderRow).toBeVisible();
    await orderRow.locator('button:has-text("Advance Stage")').click();

    await expect(this.modal).toBeVisible();
    await this.stageSelect.selectOption(newStageValue);
    await this.updatePipelineBtn.click();
    await expect(this.modal).toBeHidden({ timeout: 5000 });
  }

  async editOrderSpecs(trackingIdOrPkg, { origin, destination, price }) {
    const orderRow = this.page.locator(`table tbody tr:has-text("${trackingIdOrPkg}")`).first();
    await expect(orderRow).toBeVisible();
    await orderRow.locator('button:has-text("Edit Specs")').click();

    await expect(this.modal).toBeVisible();
    if (origin) await this.editOriginInput.fill(origin);
    if (destination) await this.editDestInput.fill(destination);
    if (price) await this.editPriceInput.fill(String(price));
    await this.updateSpecsBtn.click();
    await expect(this.modal).toBeHidden({ timeout: 5000 });
  }

  async verifyOrderStatusInTable(trackingIdOrPkg, expectedStatus) {
    const orderRow = this.page.locator(`table tbody tr:has-text("${trackingIdOrPkg}")`).first();
    await expect(orderRow).toBeVisible();
    await expect(orderRow.locator('.status-badge')).toContainText(expectedStatus);
  }
}

module.exports = { ManagerPage };
