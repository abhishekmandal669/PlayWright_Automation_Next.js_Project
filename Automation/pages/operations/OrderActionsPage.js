const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');

class OrderActionsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // View Drawer Locators
    this.viewDrawer = page.locator('div.waybill-topbar, div:has-text("Live tracking active")').first();
    this.drawerTrackingTag = page.locator('.track-pill-mono');
    this.drawerStatusTag = page.locator('.pill-amber-warm');
    this.drawerEditBtn = page.locator('.waybill-topbar button:has-text("Edit")');
    this.drawerCloseBtn = page.locator('.waybill-topbar button:has-text("✕"), .waybill-topbar button:has-text("Close")').first();

    // Shipping Label Modal
    this.shippingLabelModal = page.locator('h3:has-text("Thermal Shipping Label")');
    this.shippingLabelCloseBtn = page.locator('div:has(> h3:has-text("Thermal Shipping Label")) button:has-text("✕")');

    // Customs Invoice Modal
    this.customsInvoiceModal = page.locator('h3:has-text("Customs Export Invoice")');
    this.customsInvoiceCloseBtn = page.locator('div:has(> h3:has-text("Customs Export Invoice")) button:has-text("✕")');

    // Full Page Edit Locators
    this.editHeading = page.locator('h1:has-text("Edit Shipment Order")');
    this.customerLockedBadge = page.locator('span:has-text("🔒 Read-Only"), h2:has-text("Customer Account Record (Locked)"), div:has-text("Customer Account Record (Locked)")').first();
    this.editPackageNameInput = page.locator('input[placeholder*="Prototype"], input[value]').nth(2);
    this.editSaveButton = page.locator('button[type="submit"]:has-text("Save Specification Changes"), button[type="submit"]:has-text("Save")');
    this.editSuccessAlert = page.locator('div:has-text("specifications updated successfully!")');
  }

  async openViewDrawer(trackingIdOrName) {
    const item = this.page.locator('.order-pipeline-card, .paper-card, table tbody tr').filter({ hasText: trackingIdOrName }).first();
    const viewBtn = item.locator('a:has-text("View"), button:has-text("View"), a:has-text("👁️"), button:has-text("👁️")').first();
    await viewBtn.click();
    await expect(this.page).toHaveURL(/\/order\//, { timeout: 10000 });
  }

  async openEditModal(trackingIdOrName) {
    const item = this.page.locator('.order-pipeline-card, .paper-card, table tbody tr').filter({ hasText: trackingIdOrName }).first();
    const editBtn = item.locator('a:has-text("Edit"), button:has-text("Edit"), a:has-text("✏️"), button:has-text("✏️")').first();
    await editBtn.click();
    await expect(this.page).toHaveURL(/\/order\/edit\//, { timeout: 10000 });
  }

  async verifyCustomerLockedInEditModal() {
    await expect(this.customerLockedBadge).toBeVisible();
  }

  async updatePackageSpecs({ packageName, weight, priceOverride }) {
    if (packageName) {
      await this.editPackageNameInput.fill('');
      await this.editPackageNameInput.fill(packageName);
    }
    if (weight !== undefined) {
      await this.editWeightInput.fill('');
      await this.editWeightInput.fill(String(weight));
    }
    if (priceOverride !== undefined) {
      await this.editPriceOverrideInput.fill('');
      await this.editPriceOverrideInput.fill(String(priceOverride));
    }
    await this.editSaveButton.click();
    await expect(this.editSuccessAlert).toBeVisible({ timeout: 10000 });
  }

  async closeViewDrawer() {
    if (await this.drawerCloseBtn.isVisible()) {
      await this.drawerCloseBtn.click();
    }
  }

  async closeEditModal() {
    if (await this.editCloseButton.isVisible()) {
      await this.editCloseButton.click();
    }
  }
}

module.exports = { OrderActionsPage };
