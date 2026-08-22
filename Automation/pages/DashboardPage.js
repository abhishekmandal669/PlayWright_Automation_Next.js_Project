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
    this.createOrderBtn = page.locator('#create-order-btn');
    this.metricsCards = page.locator('.grid-cards .card');

    // Create Order Modal Locators
    this.orderModal = page.locator('.modal-content');
    this.packageNameInput = page.locator('.modal-content input[placeholder*="Electronic"]');
    this.originInput = page.locator('.modal-content .form-group:has(label:has-text("Origin")) input');
    this.destinationInput = page.locator('.modal-content .form-group:has(label:has-text("Destination")) input');
    this.quantityInput = page.locator('.modal-content .form-group:has(label:has-text("Quantity")) input');
    this.weightInput = page.locator('.modal-content .form-group:has(label:has-text("Weight")) input');
    this.lengthInput = page.locator('.modal-content input[placeholder="L"]');
    this.widthInput = page.locator('.modal-content input[placeholder="W"]');
    this.heightInput = page.locator('.modal-content input[placeholder="H"]');
    this.fragileCheckbox = page.locator('.modal-content label:has-text("Fragile") input');
    this.expressCheckbox = page.locator('.modal-content label:has-text("Express") input');
    this.submitOrderBtn = page.locator('.modal-content button[type="submit"]');
    this.closeModalBtn = page.locator('.modal-content .close-btn');

    // Volumetric Engine Price Preview
    this.estimatedPriceText = page.locator('.modal-content :has-text("Estimated Total:")');
    this.volumetricWtText = page.locator('.modal-content :has-text("Volumetric Weight:")');

    // Order Pipeline Cards & Stepper
    this.orderCards = page.locator('.order-pipeline-card');
    this.stepperStages = page.locator('.pipeline-stepper > div');
  }

  async verifyDashboardLoaded(userName) {
    // Generous timeout for login redirect + Next.js hydration on dev server
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await expect(this.welcomeHeading).toBeVisible({ timeout: 20000 });
    if (userName) {
      await expect(this.welcomeHeading).toContainText(userName);
    }
    await expect(this.createOrderBtn).toBeVisible({ timeout: 20000 });
    await expect(this.metricsCards).toHaveCount(3);
  }

  async openCreateOrderModal() {
    await this.createOrderBtn.click();
    await expect(this.orderModal).toBeVisible();
  }

  async fillShipmentDetails({ packageName, origin, destination, quantity, weight, length, width, height, fragile = false, express = false }) {
    if (packageName) await this.packageNameInput.fill(packageName);
    if (origin) await this.originInput.fill(origin);
    if (destination) await this.destinationInput.fill(destination);
    if (quantity) await this.quantityInput.fill(String(quantity));
    if (weight) await this.weightInput.fill(String(weight));
    if (length) await this.lengthInput.fill(String(length));
    if (width) await this.widthInput.fill(String(width));
    if (height) await this.heightInput.fill(String(height));

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
  }

  async verifyOrderCreated(packageName, expectedStatus = 'PICKUP_PENDING') {
    const targetOrder = this.page.locator(`.order-pipeline-card:has-text("${packageName}")`);
    await expect(targetOrder).toBeVisible({ timeout: 10000 });
    await expect(targetOrder).toContainText(expectedStatus);
  }
}

module.exports = { DashboardPage };
