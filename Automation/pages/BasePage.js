const { expect } = require('@playwright/test');

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.brandLogo = page.locator('#brand-logo');
    this.accentBadge = page.locator('.accent-badge');
    this.themeToggleBtn = page.locator('.theme-toggle-btn');
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
    await expect(this.accentBadge).toBeVisible();
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
}

module.exports = { BasePage };
