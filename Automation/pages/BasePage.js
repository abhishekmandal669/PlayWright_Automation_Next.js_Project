const { expect } = require('@playwright/test');

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Header Global Navigation Locators
    this.brandLogo = page.locator('header a[href="/dashboard"], header a[href="/"]');
    this.navOrders = page.locator('header nav a:has-text("All Orders")');
    this.navCreateOrder = page.locator('header nav a:has-text("+ Create Order")');
    this.navSettings = page.locator('header nav a:has-text("Settings")');

    // Header User Controls
    this.logoutBtn = page.locator('#logout-btn');
    this.headerProfileLink = page.locator('header a[href="/profile"]');
    this.headerRoleBadge = page.locator('header span.uppercase');
    this.headerUserName = page.locator('header span.font-semibold');
    this.htmlTag = page.locator('html');
  }

  async navigateTo(path = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  async waitForCardHydrated(selector = '#login-card[data-hydrated="true"], #register-card[data-hydrated="true"], #forgot-password-card[data-hydrated="true"]') {
    try {
      const card = this.page.locator(selector).first();
      await card.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    } catch (_) {}
    await this.page.waitForTimeout(300);
  }

  async safeFill(locator, value) {
    if (value === null || value === undefined) return;
    await locator.waitFor({ state: 'visible', timeout: 15000 });
    await locator.click();
    await locator.fill('');
    await locator.fill(String(value));
    const current = await locator.inputValue();
    if (current !== String(value)) {
      await this.page.waitForTimeout(100);
      await locator.click();
      await locator.fill(String(value));
    }
  }

  async getTitle() {
    return await this.page.title();
  }

  async verifyBrandHeader() {
    await expect(this.brandLogo).toBeVisible();
    await expect(this.brandLogo).toContainText('FreightProxy');
  }

  async verifyHeaderUser(role, name) {
    if (role) {
      await expect(this.headerRoleBadge).toBeVisible({ timeout: 15000 });
      await expect(this.headerRoleBadge).toContainText(role, { ignoreCase: true });
    }
    if (name) {
      await expect(this.headerUserName).toBeVisible({ timeout: 15000 });
      await expect(this.headerUserName).toContainText(name.split(' ')[0], { ignoreCase: true });
    }
    await expect(this.logoutBtn).toBeVisible({ timeout: 15000 });
  }

  async logout() {
    await expect(this.logoutBtn).toBeVisible({ timeout: 15000 });
    await this.logoutBtn.click();
    await expect(this.page).toHaveURL(/\//, { timeout: 15000 });
  }
}

module.exports = { BasePage };
