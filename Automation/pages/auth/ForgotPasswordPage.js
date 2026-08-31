const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');

class ForgotPasswordPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.path = '/forgot-password';

    // Headings
    this.heading = page.locator('h1:has-text("Reset Password"), h1:has-text("Enter Verification Code")');
    this.emailInput = page.locator('input[placeholder="name@company.com"]');
    this.sendCodeBtn = page.locator('button[type="submit"]:has-text("Send Verification Code")');

    // Step 2 Locators
    this.otpInput = page.locator('input[placeholder="000000"]');
    this.newPasswordInput = page.locator('input[placeholder="••••••••"]').first();
    this.confirmPasswordInput = page.locator('input[placeholder="••••••••"]').nth(1);
    this.resetPasswordBtn = page.locator('button[type="submit"]:has-text("Set New Password"), button[type="submit"]:has-text("Update Password")');

    // Messages
    this.errorBanner = page.locator('div.bg-red-50, div.text-red-800');
    this.successBanner = page.locator('div.bg-green-50, div.text-green-800');
    this.demoOtpHint = page.locator('strong.font-mono');
  }

  async navigate() {
    await this.navigateTo(this.path);
    await expect(this.heading).toBeVisible({ timeout: 15000 });
  }

  async requestResetOtp(email) {
    await this.waitForCardHydrated('#forgot-password-card');
    if (email !== null && email !== undefined) {
      await this.safeFill(this.emailInput, email);
    }
    await this.page.waitForTimeout(100);
    await this.sendCodeBtn.click();
    await expect(this.otpInput).toBeVisible({ timeout: 15000 });
  }

  async resetPassword({ otp, newPassword, confirmPassword }) {
    await this.page.waitForTimeout(100);
    if (otp) {
      await this.safeFill(this.otpInput, otp);
    }
    if (newPassword) {
      await this.safeFill(this.newPasswordInput, newPassword);
    }
    if (confirmPassword) {
      await this.safeFill(this.confirmPasswordInput, confirmPassword);
    }
    await this.page.waitForTimeout(100);
    await this.resetPasswordBtn.click();
  }
}

module.exports = { ForgotPasswordPage };
module.exports = { ForgotPasswordPage };
