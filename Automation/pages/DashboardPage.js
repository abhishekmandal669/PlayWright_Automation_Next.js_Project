const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class DashboardPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.welcomeHeading = page.locator('#dashboard-root #welcome-heading, #welcome-heading');
    this.roleBadge = page.locator('#user-role-badge');
    this.createOrderBtn = page.locator('#create-order-btn');
    this.metricsCards = page.locator('.grid.grid-cols-1.sm\\:grid-cols-3 .paper-card, .paper-card');

    // Create Order Modal Locators
    this.orderModal = page.locator('.modal-content');
    this.packageNameInput = page.locator('.modal-content input[placeholder*="Electronic"]');
    this.originInput = page.locator('.modal-content .form-group:has(label:has-text("Origin")) input');
    this.destinationInput = page.locator('.modal-content .form-group:has(label:has-text("Destination")) input');
    this.quantityInput = page.locator('.modal-content .form-group:has(label:has-text("Quantity")) input');
    this.weightInput = page.locator('.modal-content .form-group:has(label:has-text("Weight")) input');
    this.lengthInput = page.locator('.modal-content input[placeholder="Length"]');
    this.widthInput = page.locator('.modal-content input[placeholder="Width"]');
    this.heightInput = page.locator('.modal-content input[placeholder="Height"]');
    this.fragileCheckbox = page.locator('.modal-content label:has-text("Fragile") input');
    this.expressCheckbox = page.locator('.modal-content label:has-text("Express") input');
    this.submitOrderBtn = page.locator('.modal-content button[type="submit"]');
    this.closeModalBtn = page.locator('.modal-content .close-btn');

    // Volumetric Engine Price Preview
    this.estimatedPriceText = page.locator('.modal-content :has-text("Estimated Total:")');
    this.volumetricWtText = page.locator('.modal-content :has-text("Volumetric Weight:")');

    // Order Pipeline Cards & Stepper
    this.orderCards = page.locator('.paper-card:has(.pill), .paper-card');
  }

  async verifyDashboardLoaded(userName) {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 25000 });
    await expect(this.welcomeHeading).toBeVisible({ timeout: 20000 });
    if (userName) {
      await expect(this.welcomeHeading).toContainText(userName.split(' ')[0]);
    }
    await expect(this.createOrderBtn).toBeVisible({ timeout: 20000 });
  }

  async openCreateOrderModal() {
    await this.createOrderBtn.click();
    await expect(this.orderModal).toBeVisible({ timeout: 10000 });
  }

  async fillShipmentDetails({ packageName, origin, destination, quantity, weight, length, width, height, fragile = false, express = false }) {
    if (packageName) await this.safeFill(this.packageNameInput, packageName);
    if (origin) await this.safeFill(this.originInput, origin);
    if (destination) await this.safeFill(this.destinationInput, destination);
    if (quantity) await this.safeFill(this.quantityInput, String(quantity));
    if (weight) await this.safeFill(this.weightInput, String(weight));
    if (length) await this.safeFill(this.lengthInput, String(length));
    if (width) await this.safeFill(this.widthInput, String(width));
    if (height) await this.safeFill(this.heightInput, String(height));

    const isFragileChecked = await this.fragileCheckbox.isChecked();
    if (fragile !== isFragileChecked) {
      await this.fragileCheckbox.click();
    }

    const isExpressChecked = await this.expressCheckbox.isChecked();
    if (express !== isExpressChecked) {
      await this.expressCheckbox.click();
    }
  }

  async verifyLiveVolumetricCalculation(expectedVolumetricWt, expectedTotalPrice) {
    if (expectedVolumetricWt) {
      await expect(this.volumetricWtText.last()).toContainText(expectedVolumetricWt);
    }
    if (expectedTotalPrice) {
      await expect(this.estimatedPriceText.last()).toContainText(expectedTotalPrice);
    }
  }

  async submitShipmentOrder() {
    await this.submitOrderBtn.click();
    await expect(this.orderModal).toBeHidden({ timeout: 15000 });
  }

  async verifyOrderCreated(packageName, expectedStatus) {
    const targetOrder = this.page.locator(`.paper-card:has-text("${packageName}"), div:has-text("${packageName}")`).first();
    await expect(targetOrder).toBeVisible({ timeout: 15000 });
    if (expectedStatus) {
      const normalized = expectedStatus.replace(/_/g, ' ');
      await expect(targetOrder).toContainText(normalized, { ignoreCase: true });
    }
  }
}

module.exports = { DashboardPage };
