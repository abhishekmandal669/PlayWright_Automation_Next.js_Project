const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class DriversPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.path = '/drivers';

    // Headings & Actions
    this.driversHeading = page.locator('h1:has-text("Fleet & Driver Operations")');
    this.registerDriverBtn = page.locator('#add-driver-btn, button:has-text("+ Register Driver")');
    this.feedbackAlert = page.locator('div:has-text("✓")');

    // Filter Buttons
    this.filterAllBtn = page.locator('button.status-tab-btn:has-text("All")');
    this.filterActiveBtn = page.locator('button.status-tab-btn:has-text("Active")');
    this.filterOnRouteBtn = page.locator('button.status-tab-btn:has-text("On Route")');
    this.filterOffDutyBtn = page.locator('button.status-tab-btn:has-text("Off Duty")');
    this.searchInput = page.locator('input[placeholder*="Search driver"]');

    // Modal Locators
    this.modal = page.locator('div.fixed.inset-0 form').first();
    this.nameInput = page.locator('input[placeholder*="Rajesh Kumar"], input[placeholder="Full legal name"]');
    this.emailInput = page.locator('input[placeholder="driver@freightproxy.io"]');
    this.phoneInput = page.locator('input[placeholder*="98765"], input[placeholder*="555"]');
    this.licenseInput = page.locator('input[placeholder*="DL-04"], input[placeholder*="CDL"]');
    this.vehicleNumInput = page.locator('input[placeholder*="DL-01"], input[placeholder*="TRK"]');
    this.vehicleTypeSelect = page.locator('div.fixed.inset-0 select').first();
    this.statusSelect = page.locator('div.fixed.inset-0 select').nth(1);
    this.saveDriverBtn = page.locator('button[type="submit"]:has-text("Register Driver"), button[type="submit"]:has-text("Update Driver"), button[type="submit"]:has-text("Save")');
  }

  async navigate() {
    await this.navigateTo(this.path);
    await expect(this.driversHeading).toBeVisible({ timeout: 20000 });
  }

  async verifyDriversPageLoaded() {
    await expect(this.driversHeading).toBeVisible();
    await expect(this.registerDriverBtn).toBeVisible();
  }

  async openRegisterDriverModal() {
    await this.registerDriverBtn.click();
    await expect(this.nameInput).toBeVisible();
  }

  async registerNewDriver({ name, email, phone, license, vehicleNum, vehicleType = 'Delivery Van' }) {
    await this.openRegisterDriverModal();
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    if (phone) await this.phoneInput.fill(phone);
    if (license) await this.licenseInput.fill(license);
    if (vehicleNum) await this.vehicleNumInput.fill(vehicleNum);
    if (vehicleType) await this.vehicleTypeSelect.selectOption(vehicleType);
    await this.saveDriverBtn.click();
    await this.page.waitForTimeout(500);
  }

  async searchDriver(query) {
    await this.searchInput.fill('');
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300);
  }

  async verifyDriverInTable(driverName) {
    const driverRow = this.page.locator(`table tbody tr:has-text("${driverName}")`).first();
    await expect(driverRow).toBeVisible();
  }
}

module.exports = { DriversPage };
