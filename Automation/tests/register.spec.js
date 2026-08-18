const { test, expect } = require('@playwright/test');
const { RegisterPage } = require('../pages/RegisterPage');
const { TestDataGenerator } = require('../utils/testData');

test.describe('Registration Module Tests', () => {
  let registerPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.navigate();
  });

  test('POS-01: Should register a new user successfully', async () => {
    const user = TestDataGenerator.generateUser();
    await registerPage.register(user.name, user.email, user.password, user.password);
    await registerPage.verifySuccessBanner('Account created successfully');
  });

  test('POS-02: Should update Password Strength meter dynamically based on complexity', async () => {
    // Weak password (< 6 chars)
    await registerPage.passwordInput.fill('12345');
    await expect(registerPage.strengthBar).toHaveClass(/strength-weak/);

    // Medium password (>= 6 chars)
    await registerPage.passwordInput.fill('password123');
    await expect(registerPage.strengthBar).toHaveClass(/strength-medium/);

    // Strong password (>= 8 chars with uppercase & number)
    await registerPage.passwordInput.fill('SecurePass99!');
    await expect(registerPage.strengthBar).toHaveClass(/strength-strong/);
  });

  test('NEG-01: Should show error when passwords do not match', async () => {
    const user = TestDataGenerator.generateUser();
    await registerPage.register(user.name, user.email, 'Password123!', 'DifferentPassword123!');
    await registerPage.verifyErrorBanner('Passwords do not match');
  });

  test('NEG-02: Should show error when password is less than 6 characters', async () => {
    const user = TestDataGenerator.generateUser();
    await registerPage.register(user.name, user.email, '12345', '12345');
    await registerPage.verifyErrorBanner('Password must be at least 6 characters');
  });

  test('NEG-03: Should show error when registering with an existing email address', async () => {
    const demoUser = TestDataGenerator.demoCredentials;
    await registerPage.register('Demo Copy', demoUser.email, 'Password123!', 'Password123!');
    await registerPage.verifyErrorBanner('already exists');
  });

  test('NAV-01: Should navigate back to Login page when clicking Sign In link', async ({ page }) => {
    await registerPage.clickLoginLink();
    await expect(page).toHaveURL(/\//);
  });
});
