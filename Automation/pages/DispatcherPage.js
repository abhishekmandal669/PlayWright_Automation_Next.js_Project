const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class DispatcherPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.path = '/dispatcher';

    // Headings & Header Actions
    this.dispatcherHeading = page.locator('h1:has-text("Dispatcher Staging Hub")');
    this.fleetDriversLink = page.locator('a[href="/drivers"]:has-text("Fleet Drivers")');
    this.saveDispatchBtn = page.locator('button:has-text("Save & Dispatch")');
    this.feedbackAlert = page.locator('div:has-text("✓")');

    // Controls
    this.dateFilterSelect = page.locator('select').first();
    this.expandAllBtn = page.locator('button:has-text("Expand All")');
    this.collapseAllBtn = page.locator('button:has-text("Collapse All")');

    // Map Container
    this.mapContainer = page.locator('#map, .leaflet-container, div:has-text("Leaflet Map")').first();
  }

  async navigate() {
    await this.navigateTo(this.path);
    await expect(this.dispatcherHeading).toBeVisible({ timeout: 20000 });
  }

  async verifyDispatcherLoaded() {
    await expect(this.dispatcherHeading).toBeVisible();
    await expect(this.fleetDriversLink).toBeVisible();
  }

  async expandAllLocationGroups() {
    if (await this.expandAllBtn.isVisible()) {
      await this.expandAllBtn.click();
      await this.page.waitForTimeout(400);
    }
  }

  async selectOrderCheckbox(trackingIdOrName) {
    const row = this.page.locator(`div:has-text("${trackingIdOrName}")`).first();
    const checkbox = row.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }
  }

  async selectDriverForLocation(locationIndex = 0, driverNameOrId) {
    const driverSelect = this.page.locator('select').nth(locationIndex + 1);
    if (await driverSelect.isVisible()) {
      if (driverNameOrId) {
        await driverSelect.selectOption({ label: driverNameOrId }).catch(() => driverSelect.selectOption({ index: 1 }));
      } else {
        await driverSelect.selectOption({ index: 1 });
      }
    }
  }

  async unassignOrder(trackingIdOrName) {
    const orderItem = this.page.locator(`div:has-text("${trackingIdOrName}")`).first();
    const unassignBtn = orderItem.locator('button:has-text("Unassign"), button[title*="Unassign"]').first();
    if (await unassignBtn.isVisible()) {
      await unassignBtn.click();
      await this.page.waitForTimeout(500);
    }
  }
}

module.exports = { DispatcherPage };
