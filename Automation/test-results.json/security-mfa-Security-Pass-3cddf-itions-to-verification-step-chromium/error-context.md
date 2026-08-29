# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security-mfa.spec.js >> Security & Password Recovery Tests >> SEC-01: Forgot Password OTP request transitions to verification step
- Location: tests\security-mfa.spec.js:22:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder="000000"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('input[placeholder="000000"]')

```

```yaml
- banner:
  - link "📦 FreightProxy.io":
    - /url: /
  - navigation
- main:
  - text: 🔐
  - heading "Reset Password" [level=1]
  - paragraph: Enter your registered work email to receive a 6-digit verification code.
  - text: ⚠️ Please enter your work email address. Work Email Address
  - textbox "name@company.com"
  - button "Send Verification Code →"
  - text: Remember your password?
  - link "Return to Sign In":
    - /url: /
- alert
```

# Test source

```ts
  1  | const { expect } = require('@playwright/test');
  2  | const { BasePage } = require('./BasePage');
  3  | 
  4  | class ForgotPasswordPage extends BasePage {
  5  |   /**
  6  |    * @param {import('@playwright/test').Page} page
  7  |    */
  8  |   constructor(page) {
  9  |     super(page);
  10 |     this.path = '/forgot-password';
  11 | 
  12 |     // Headings
  13 |     this.heading = page.locator('h1:has-text("Reset Password"), h1:has-text("Enter Verification Code")');
  14 |     this.emailInput = page.locator('input[placeholder="name@company.com"]');
  15 |     this.sendCodeBtn = page.locator('button[type="submit"]:has-text("Send Verification Code")');
  16 | 
  17 |     // Step 2 Locators
  18 |     this.otpInput = page.locator('input[placeholder="000000"]');
  19 |     this.newPasswordInput = page.locator('input[placeholder="••••••••"]').first();
  20 |     this.confirmPasswordInput = page.locator('input[placeholder="••••••••"]').nth(1);
  21 |     this.resetPasswordBtn = page.locator('button[type="submit"]:has-text("Set New Password"), button[type="submit"]:has-text("Update Password")');
  22 | 
  23 |     // Messages
  24 |     this.errorBanner = page.locator('div.bg-red-50, div.text-red-800');
  25 |     this.successBanner = page.locator('div.bg-green-50, div.text-green-800');
  26 |     this.demoOtpHint = page.locator('strong.font-mono');
  27 |   }
  28 | 
  29 |   async navigate() {
  30 |     await this.navigateTo(this.path);
  31 |     await expect(this.heading).toBeVisible({ timeout: 15000 });
  32 |   }
  33 | 
  34 |   async requestResetOtp(email) {
  35 |     await this.waitForCardHydrated('#forgot-password-card');
  36 |     if (email !== null && email !== undefined) {
  37 |       await this.safeFill(this.emailInput, email);
  38 |     }
  39 |     await this.page.waitForTimeout(100);
  40 |     await this.sendCodeBtn.click();
> 41 |     await expect(this.otpInput).toBeVisible({ timeout: 15000 });
     |                                 ^ Error: expect(locator).toBeVisible() failed
  42 |   }
  43 | 
  44 |   async resetPassword({ otp, newPassword, confirmPassword }) {
  45 |     await this.page.waitForTimeout(100);
  46 |     if (otp) {
  47 |       await this.safeFill(this.otpInput, otp);
  48 |     }
  49 |     if (newPassword) {
  50 |       await this.safeFill(this.newPasswordInput, newPassword);
  51 |     }
  52 |     if (confirmPassword) {
  53 |       await this.safeFill(this.confirmPasswordInput, confirmPassword);
  54 |     }
  55 |     await this.page.waitForTimeout(100);
  56 |     await this.resetPasswordBtn.click();
  57 |   }
  58 | }
  59 | 
  60 | module.exports = { ForgotPasswordPage };
  61 | 
```