const { expect } = require('@playwright/test');

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Header Global Navigation Locators
    this.brandLogo = page.locator('header a[href="/dashboard"], header a[href="/"]');
    this.navShipments = page.locator('header nav a:has-text("Shipments")');
    this.navManagerHub = page.locator('header nav a:has-text("Manager Hub")');
    this.navAdminConsole = page.locator('header nav a:has-text("Admin Console")');
    this.navProfile = page.locator('header nav a:has-text("Profile")');
    this.navSettings = page.locator('header nav a:has-text("Settings")');

    // Header Theme & User Controls
    this.themeToggleBtn = page.locator('#theme-toggle-btn');
    this.logoutBtn = page.locator('#logout-btn');
    this.headerRoleBadge = page.locator('header span.uppercase');
    this.headerUserName = page.locator('header span.text-xs.font-bold');
    this.htmlTag = page.locator('html');
  }

  async navigateTo(path = '/') {
    await this.page.goto(path);
  }

  async getTitle() {
    return await this.page.title();
  }

  async verifyBrandHeader() {
    await expect(this.brandLogo).toBeVisible();
    await expect(this.brandLogo).toContainText('FreightProxy');
  }

  async toggleTheme() {
    await expect(this.themeToggleBtn).toBeVisible();
    await this.themeToggleBtn.click();
  }

  async getCurrentTheme() {
    return await this.htmlTag.getAttribute('data-theme');
  }

  async verifyDarkThemeActive() {
    await expect(this.htmlTag).toHaveAttribute('data-theme', 'dark');
    await expect(this.themeToggleBtn).toContainText('Light');
  }

  async verifyLightThemeActive() {
    await expect(this.htmlTag).toHaveAttribute('data-theme', 'light');
    await expect(this.themeToggleBtn).toContainText('Dark');
  }

  async verifyHeaderUser(role, name) {
    if (role) {
      await expect(this.headerRoleBadge).toBeVisible({ timeout: 10000 });
      await expect(this.headerRoleBadge).toContainText(role, { ignoreCase: true });
    }
    if (name) {
      await expect(this.headerUserName).toBeVisible({ timeout: 10000 });
      await expect(this.headerUserName).toContainText(name.split(' ')[0], { ignoreCase: true });
    }
    await expect(this.logoutBtn).toBeVisible({ timeout: 10000 });
  }

  async logout() {
    await expect(this.logoutBtn).toBeVisible({ timeout: 10000 });
    await this.logoutBtn.click();
    await expect(this.page).toHaveURL(/\//, { timeout: 10000 });
  }
}

module.exports = { BasePage };
