# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-regression.spec.js >> Visual Regression & UI Snapshot Tests >> VIS-05: Visual snapshot of Admin Master Console
- Location: tests\visual-regression.spec.js:79:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin/
Received string:  "http://localhost:3000/"
Timeout: 25000ms

Call log:
  - Expect "toHaveURL" with timeout 25000ms
    53 × locator resolved to <html lang="en" class="h-full">…</html>
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
  1   | const { expect } = require('@playwright/test');
  2   | const { BasePage } = require('./BasePage');
  3   | 
  4   | class AdminPage extends BasePage {
  5   |   /**
  6   |    * @param {import('@playwright/test').Page} page
  7   |    */
  8   |   constructor(page) {
  9   |     super(page);
  10  |     this.heading = page.locator('h1:has-text("SuperAdmin Master Console"), h1:has-text("Admin")');
  11  |     this.addUserBtn = page.locator('#provision-user-btn, button:has-text("+ Provision Staff")');
  12  |     this.metricsCards = page.locator('.paper-card');
  13  | 
  14  |     // Tabs
  15  |     this.tabAnalytics = page.locator('button:has-text("Revenue & BI Analytics")');
  16  |     this.tabUsers = page.locator('button:has-text("User Access & RBAC")');
  17  |     this.tabOrders = page.locator('button:has-text("Global Shipments")');
  18  |     this.tabRates = page.locator('button:has-text("Rate Matrix Configurator")');
  19  | 
  20  |     // User Table
  21  |     this.usersTable = page.locator('table.specs-paper, table');
  22  |     this.userRows = page.locator('table tbody tr');
  23  | 
  24  |     // Provision User Modal
  25  |     this.modal = page.locator('#provision-user-modal, div[style*="fixed"]:has(h3:has-text("Provision Operations Staff"))');
  26  |     this.nameInput = page.locator('#provision-user-modal input[type="text"], div[style*="fixed"] input[type="text"]').first();
  27  |     this.emailInput = page.locator('#provision-user-modal input[type="email"], div[style*="fixed"] input[type="email"]');
  28  |     this.passwordInput = page.locator('#provision-user-modal input[type="password"], div[style*="fixed"] input[type="password"]');
  29  |     this.roleSelect = page.locator('#provision-user-modal select, div[style*="fixed"] select');
  30  |     this.deptInput = page.locator('#provision-user-modal input[type="text"], div[style*="fixed"] input[type="text"]').last();
  31  |     this.submitUserBtn = page.locator('#provision-user-modal button[type="submit"], button:has-text("Provision Account")');
  32  |   }
  33  | 
  34  |   async verifyAdminPageLoaded() {
> 35  |     await expect(this.page).toHaveURL(/\/admin/, { timeout: 25000 });
      |                             ^ Error: expect(page).toHaveURL(expected) failed
  36  |     await expect(this.heading).toBeVisible({ timeout: 20000 });
  37  |     await expect(this.addUserBtn).toBeVisible({ timeout: 20000 });
  38  |   }
  39  | 
  40  |   async selectTab(tabName) {
  41  |     if (tabName === 'users') await this.tabUsers.click();
  42  |     else if (tabName === 'orders') await this.tabOrders.click();
  43  |     else if (tabName === 'rates') await this.tabRates.click();
  44  |     else if (tabName === 'analytics') await this.tabAnalytics.click();
  45  |     await this.page.waitForTimeout(300);
  46  |   }
  47  | 
  48  |   async openAddUserModal() {
  49  |     await this.addUserBtn.click();
  50  |     await expect(this.modal).toBeVisible({ timeout: 10000 });
  51  |   }
  52  | 
  53  |   async createNewUser({ name, email, password, role = 'User', department = 'Operations' }) {
  54  |     await this.openAddUserModal();
  55  |     await this.safeFill(this.nameInput, name);
  56  |     await this.safeFill(this.emailInput, email);
  57  |     await this.safeFill(this.passwordInput, password);
  58  |     await this.roleSelect.selectOption(role);
  59  |     if (department) await this.safeFill(this.deptInput, department);
  60  |     await this.page.waitForTimeout(100);
  61  |     await this.submitUserBtn.click();
  62  |     await expect(this.modal).toBeHidden({ timeout: 15000 });
  63  |     await this.page.waitForTimeout(500);
  64  |   }
  65  | 
  66  |   async findUserRow(email) {
  67  |     await this.selectTab('users');
  68  |     let userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
  69  |     let isVisible = await userRow.isVisible().catch(() => false);
  70  |     if (!isVisible) {
  71  |       const pageSizeDropdown = this.page.locator('select:has(option:has-text("100 entries")), select:has(option:has-text("entries"))').first();
  72  |       if (await pageSizeDropdown.isVisible()) {
  73  |         await pageSizeDropdown.selectOption('100');
  74  |         await this.page.waitForTimeout(800);
  75  |       }
  76  |       userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
  77  |       isVisible = await userRow.isVisible().catch(() => false);
  78  |       if (!isVisible) {
  79  |         const nextBtn = this.page.locator('button:has-text("Next →")');
  80  |         while (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
  81  |           await nextBtn.click();
  82  |           await this.page.waitForTimeout(500);
  83  |           userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
  84  |           if (await userRow.isVisible().catch(() => false)) break;
  85  |         }
  86  |       }
  87  |     }
  88  |     userRow = this.page.locator(`table tbody tr:has-text("${email}")`);
  89  |     await expect(userRow).toBeVisible({ timeout: 10000 });
  90  |     return userRow;
  91  |   }
  92  | 
  93  |   async changeUserRole(email, newRole) {
  94  |     const userRow = await this.findUserRow(email);
  95  |     const roleDropdown = userRow.locator('select.sort-select, select');
  96  |     await roleDropdown.selectOption(newRole);
  97  |     await this.page.waitForTimeout(500);
  98  |   }
  99  | 
  100 |   async toggleUserStatus(email) {
  101 |     const userRow = await this.findUserRow(email);
  102 |     const statusBtn = userRow.locator('button.btn-paper, button');
  103 |     await statusBtn.click();
  104 |     await this.page.waitForTimeout(500);
  105 |   }
  106 | 
  107 |   async verifyUserInRoster(email, expectedRole, expectedStatus) {
  108 |     const userRow = await this.findUserRow(email);
  109 |     if (expectedRole) {
  110 |       await expect(userRow.locator('select.sort-select, select')).toHaveValue(expectedRole);
  111 |     }
  112 |     if (expectedStatus) {
  113 |       await expect(userRow).toContainText(expectedStatus);
  114 |     }
  115 |   }
  116 | 
  117 |   async verifyOrderInMasterTable(trackingId) {
  118 |     await this.selectTab('orders');
  119 |     const orderRow = this.page.locator(`table tbody tr:has-text("${trackingId}")`);
  120 |     await expect(orderRow).toBeVisible({ timeout: 10000 });
  121 |   }
  122 | }
  123 | 
  124 | module.exports = { AdminPage };
  125 | 
```