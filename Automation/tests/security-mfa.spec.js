const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegisterPage } = require('../pages/RegisterPage');
const { ForgotPasswordPage } = require('../pages/ForgotPasswordPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Security & Password Recovery Tests', () => {
  let loginPage;
  let registerPage;
  let forgotPasswordPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    forgotPasswordPage = new ForgotPasswordPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('SEC-01: Forgot Password OTP request transitions to verification step', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();

    // Register user
    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);

    // Navigate to /forgot-password
    await forgotPasswordPage.navigate();
    await forgotPasswordPage.requestResetOtp(customer.email);

    // Verify OTP input is displayed
    await expect(forgotPasswordPage.otpInput).toBeVisible();
  });

  test('SEC-02: Forgot Password validates password match requirement', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();

    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);

    await forgotPasswordPage.navigate();
    await forgotPasswordPage.requestResetOtp(customer.email);

    // Enter mismatched passwords
    await forgotPasswordPage.resetPassword({
      otp: '123456',
      newPassword: 'NewPassword123!',
      confirmPassword: 'DifferentPassword456!',
    });

    // Verify error banner
    await expect(forgotPasswordPage.errorBanner).toContainText('Passwords do not match');
  });

  test('SEC-03: Password reset completes successfully and enables login with new password', async ({ page }) => {
    const customer = TestDataGenerator.generateUser();
    const newPassword = 'BrandNewPassword2026!';

    await registerPage.navigate();
    await registerPage.register(customer.name, customer.email, customer.password, customer.password);

    await forgotPasswordPage.navigate();
    await forgotPasswordPage.requestResetOtp(customer.email);

    // Reset password with demo OTP
    const demoOtp = await forgotPasswordPage.demoOtpHint.textContent();
    await forgotPasswordPage.resetPassword({
      otp: demoOtp ? demoOtp.trim() : '123456',
      newPassword: newPassword,
      confirmPassword: newPassword,
    });

    await expect(forgotPasswordPage.successBanner).toBeVisible({ timeout: 10000 });

    // Login with new password
    await loginPage.navigate();
    await loginPage.login(customer.email, newPassword);
    await dashboardPage.verifyDashboardLoaded(customer.name);
  });
});
