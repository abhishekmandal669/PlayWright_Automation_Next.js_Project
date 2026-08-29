# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-regression.spec.js >> Visual Regression & UI Snapshot Tests >> VIS-04: Visual snapshot of Create Order Modal Popup
- Location: tests\visual-regression.spec.js:59:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "http://localhost:3000/"
Timeout: 25000ms

Call log:
  - Expect "toHaveURL" with timeout 25000ms
    52 × locator resolved to <html lang="en" class="h-full">…</html>
       - unexpected value "http://localhost:3000/"

```

```yaml
- banner:
  - link "📦 FreightProxy.io":
    - /url: /
  - navigation
- main:
  - text: Smart Freight Logistics & Proxy Network ⚡ 99.9% Uptime SLA
  - heading "Global Proxy Freight & Volumetric Dispatch" [level=2]
  - paragraph: Automated multi-stage routing, live volumetric pricing matrix, and end-to-end audit trail tracking across international logistics gateways.
  - text: ✈️ Air Linehaul Hubs ⚖️ Live Dimensional Engine 🔒 Immutable Logs
  - heading "FreightProxy Sign In" [level=1]
  - paragraph: Access your Role-Based Logistics Console
  - text: Work Email Address
  - textbox "Work Email Address":
    - /placeholder: name@company.com
  - text: Password
  - link "Forgot Password?":
    - /url: /forgot-password
  - textbox "Password":
    - /placeholder: ••••••••
  - button "Show"
  - button "Sign In to Console"
  - text: Don't have an account?
  - link "Create Account":
    - /url: /register
  - text: 🔑
  - paragraph: Admin Access
  - paragraph: System SuperAdmin · jrqaengineer06@gmail.com
  - paragraph: Contact your IT administrator for login credentials.
  - text: 🔒 256-Bit SSL 🛡️ Google 2FA ⚡ 99.9% SLA
- alert
```

# Test source

```ts
  1  | const { expect } = require('@playwright/test');
  2  | const { BasePage } = require('./BasePage');
  3  | 
  4  | class DashboardPage extends BasePage {
  5  |   /**
  6  |    * @param {import('@playwright/test').Page} page
  7  |    */
  8  |   constructor(page) {
  9  |     super(page);
  10 |     this.welcomeHeading = page.locator('#dashboard-root #welcome-heading, #welcome-heading');
  11 |     this.roleBadge = page.locator('#user-role-badge');
  12 |     this.createOrderBtn = page.locator('#create-order-btn');
  13 |     this.metricsCards = page.locator('.grid.grid-cols-1.sm\\:grid-cols-3 .paper-card, .paper-card');
  14 | 
  15 |     // Create Order Modal Locators
  16 |     this.orderModal = page.locator('.modal-content');
  17 |     this.packageNameInput = page.locator('.modal-content input[placeholder*="Electronic"]');
  18 |     this.originInput = page.locator('.modal-content .form-group:has(label:has-text("Origin")) input');
  19 |     this.destinationInput = page.locator('.modal-content .form-group:has(label:has-text("Destination")) input');
  20 |     this.quantityInput = page.locator('.modal-content .form-group:has(label:has-text("Quantity")) input');
  21 |     this.weightInput = page.locator('.modal-content .form-group:has(label:has-text("Weight")) input');
  22 |     this.lengthInput = page.locator('.modal-content input[placeholder="Length"]');
  23 |     this.widthInput = page.locator('.modal-content input[placeholder="Width"]');
  24 |     this.heightInput = page.locator('.modal-content input[placeholder="Height"]');
  25 |     this.fragileCheckbox = page.locator('.modal-content label:has-text("Fragile") input');
  26 |     this.expressCheckbox = page.locator('.modal-content label:has-text("Express") input');
  27 |     this.submitOrderBtn = page.locator('.modal-content button[type="submit"]');
  28 |     this.closeModalBtn = page.locator('.modal-content .close-btn');
  29 | 
  30 |     // Volumetric Engine Price Preview
  31 |     this.estimatedPriceText = page.locator('.modal-content :has-text("Estimated Total:")');
  32 |     this.volumetricWtText = page.locator('.modal-content :has-text("Volumetric Weight:")');
  33 | 
  34 |     // Order Pipeline Cards & Stepper
  35 |     this.orderCards = page.locator('.paper-card:has(.pill), .paper-card');
  36 |   }
  37 | 
  38 |   async verifyDashboardLoaded(userName) {
> 39 |     await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 25000 });
     |                             ^ Error: expect(page).toHaveURL(expected) failed
  40 |     await expect(this.welcomeHeading).toBeVisible({ timeout: 20000 });
  41 |     if (userName) {
  42 |       await expect(this.welcomeHeading).toContainText(userName.split(' ')[0]);
  43 |     }
  44 |     await expect(this.createOrderBtn).toBeVisible({ timeout: 20000 });
  45 |   }
  46 | 
  47 |   async openCreateOrderModal() {
  48 |     await this.createOrderBtn.click();
  49 |     await expect(this.orderModal).toBeVisible({ timeout: 10000 });
  50 |   }
  51 | 
  52 |   async fillShipmentDetails({ packageName, origin, destination, quantity, weight, length, width, height, fragile = false, express = false }) {
  53 |     if (packageName) await this.safeFill(this.packageNameInput, packageName);
  54 |     if (origin) await this.safeFill(this.originInput, origin);
  55 |     if (destination) await this.safeFill(this.destinationInput, destination);
  56 |     if (quantity) await this.safeFill(this.quantityInput, String(quantity));
  57 |     if (weight) await this.safeFill(this.weightInput, String(weight));
  58 |     if (length) await this.safeFill(this.lengthInput, String(length));
  59 |     if (width) await this.safeFill(this.widthInput, String(width));
  60 |     if (height) await this.safeFill(this.heightInput, String(height));
  61 | 
  62 |     const isFragileChecked = await this.fragileCheckbox.isChecked();
  63 |     if (fragile !== isFragileChecked) {
  64 |       await this.fragileCheckbox.click();
  65 |     }
  66 | 
  67 |     const isExpressChecked = await this.expressCheckbox.isChecked();
  68 |     if (express !== isExpressChecked) {
  69 |       await this.expressCheckbox.click();
  70 |     }
  71 |   }
  72 | 
  73 |   async verifyLiveVolumetricCalculation(expectedVolumetricWt, expectedTotalPrice) {
  74 |     if (expectedVolumetricWt) {
  75 |       await expect(this.volumetricWtText.last()).toContainText(expectedVolumetricWt);
  76 |     }
  77 |     if (expectedTotalPrice) {
  78 |       await expect(this.estimatedPriceText.last()).toContainText(expectedTotalPrice);
  79 |     }
  80 |   }
  81 | 
  82 |   async submitShipmentOrder() {
  83 |     await this.submitOrderBtn.click();
  84 |     await expect(this.orderModal).toBeHidden({ timeout: 15000 });
  85 |   }
  86 | 
  87 |   async verifyOrderCreated(packageName, expectedStatus) {
  88 |     const targetOrder = this.page.locator(`.paper-card:has-text("${packageName}"), div:has-text("${packageName}")`).first();
  89 |     await expect(targetOrder).toBeVisible({ timeout: 15000 });
  90 |     if (expectedStatus) {
  91 |       const normalized = expectedStatus.replace(/_/g, ' ');
  92 |       await expect(targetOrder).toContainText(normalized, { ignoreCase: true });
  93 |     }
  94 |   }
  95 | }
  96 | 
  97 | module.exports = { DashboardPage };
  98 | 
```