const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');

class CreateOrderStudioPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.path = '/create-order';

    // Topbar & Headings
    this.studioHeading = page.locator('h1:has-text("New Freight Shipment Studio")');
    this.backButton = page.locator('button:has-text("Back to Console")');
    this.successAlert = page.locator('div:has-text("Shipment Order created!")').last();

    // Customer Selection (Admin/Manager)
    this.existingCustomerTab = page.locator('button:has-text("Select Existing Customer")');
    this.newCustomerTab = page.locator('button:has-text("Create on Behalf of New Customer")');
    this.customerDropdownTrigger = page.locator('div:has-text("Assigned Customer Account") + div').first();
    this.customerSearchInput = page.locator('input[placeholder*="Search customer"]');
    this.newCustomerNameInput = page.locator('input[placeholder*="Vikram Sharma"]');
    this.newCustomerEmailInput = page.locator('input[placeholder*="vikram@company.com"]');
    this.newCustomerPhoneInput = page.locator('input[placeholder*="555"]');

    // Cargo & Route Details
    this.packageNameInput = page.locator('input[placeholder*="Aerospace Carbon Prototype"], input[placeholder*="Electronic Sensors"]');
    this.originInput = page.locator('input[placeholder="City, Country"]').first();
    this.destinationInput = page.locator('input[placeholder="City, Country"]').nth(1);
    this.quantityInput = page.locator('input[type="number"][min="1"]').first();

    // Preset Dimension Buttons
    this.presetSmallBtn = page.locator('button:has-text("Small Mailer")');
    this.presetStandardBtn = page.locator('button:has-text("Standard Carton")');
    this.presetHeavyBtn = page.locator('button:has-text("Freight Pallet")');
    this.presetCustomBtn = page.locator('button:has-text("Custom Sizing")');

    // Weight & Dimension Inputs
    this.weightNumberInput = page.locator('input[type="number"][step="0.1"]');
    this.lengthInput = page.locator('div:has(> .dim-label:has-text("Length")) input');
    this.widthInput = page.locator('div:has(> .dim-label:has-text("Width")) input');
    this.heightInput = page.locator('div:has(> .dim-label:has-text("Height")) input');

    // Priority Add-ons
    this.fragileCheckbox = page.locator('label:has-text("Fragile Handling") input[type="checkbox"]');
    this.expressCheckbox = page.locator('label:has-text("Express Priority Air") input[type="checkbox"]');
    this.insuranceCheckbox = page.locator('label:has-text("Cargo Insurance") input[type="checkbox"]');

    // Notes & Submit
    this.notesTextarea = page.locator('textarea[placeholder*="Call recipient"]');
    this.submitOrderButton = page.locator('button[type="submit"]:has-text("Confirm & Dispatch Shipment Order")');

    // Sticky Live Volumetric Gauge & Breakdown
    this.livePriceDisplay = page.locator('.waybill-price-display .price-amount');
    this.chargeableWeightGauge = page.locator('.gauge-row.chargeable strong');
    this.volumetricWeightGauge = page.locator('.gauge-row:has-text("Volumetric Weight:") strong');
    this.assignedRecipientCard = page.locator('.live-customer-card');
  }

  async navigate() {
    await this.navigateTo(this.path);
    await expect(this.studioHeading).toBeVisible({ timeout: 20000 });
  }

  async selectPreset(presetName) {
    if (presetName === 'small') await this.presetSmallBtn.click();
    else if (presetName === 'standard') await this.presetStandardBtn.click();
    else if (presetName === 'heavy') await this.presetHeavyBtn.click();
    else if (presetName === 'custom') await this.presetCustomBtn.click();
    await this.page.waitForTimeout(300);
  }

  async fillPackageDetails({ packageName, origin, destination, quantity = 1 }) {
    if (packageName) await this.safeFill(this.packageNameInput, packageName);
    if (origin) await this.safeFill(this.originInput, origin);
    if (destination) await this.safeFill(this.destinationInput, destination);
    if (quantity) await this.safeFill(this.quantityInput, String(quantity));
  }

  async fillDimensions({ length, width, height, weight }) {
    if (weight !== undefined) await this.safeFill(this.weightNumberInput, String(weight));
    if (length !== undefined) await this.safeFill(this.lengthInput, String(length));
    if (width !== undefined) await this.safeFill(this.widthInput, String(width));
    if (height !== undefined) await this.safeFill(this.heightInput, String(height));
    await this.page.waitForTimeout(200);
  }

  async selectExistingCustomer(customerEmail) {
    await this.existingCustomerTab.click();
    const changeBtn = this.page.locator('span:has-text("Change"), span:has-text("Close")').first();
    if (await changeBtn.isVisible()) {
      await changeBtn.click();
    }
    await this.safeFill(this.customerSearchInput, customerEmail);
    const customerOption = this.page.locator(`div:has-text("${customerEmail}")`).last();
    await customerOption.click();
  }

  async fillNewCustomerDetails({ name, email, phone }) {
    await this.newCustomerTab.click();
    await this.safeFill(this.newCustomerNameInput, name);
    await this.safeFill(this.newCustomerEmailInput, email);
    if (phone) await this.safeFill(this.newCustomerPhoneInput, phone);
  }

  async submitShipment() {
    await this.submitOrderButton.click();
  }

  async verifySuccessAlert() {
    await expect(this.successAlert).toBeVisible({ timeout: 15000 });
  }
}

module.exports = { CreateOrderStudioPage };
