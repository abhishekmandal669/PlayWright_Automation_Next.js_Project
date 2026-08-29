/**
 * Test Data Generator & Pricing Calculator Utility
 * For FreightProxy.io Automation Suite
 */
class TestDataGenerator {
  /**
   * SuperAdmin credentials configured in the system (.env.local)
   */
  static superAdmin = {
    email: 'jrqaengineer06@gmail.com',
    password: 'Password@123',
    name: 'System SuperAdmin',
    role: 'Admin',
  };

  /**
   * Generates a unique user object for testing registration and invitation
   */
  static generateUser(role = 'User', department = 'Operations') {
    const timestamp = Date.now();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return {
      name: `QA User ${randomNum}`,
      email: `testuser_${timestamp}_${randomNum}@freightproxy.io`,
      password: `SecurePass@${randomNum}!`,
      role,
      department,
      title: role === 'Manager' ? 'Senior Freight Manager' : 'Shipping Associate',
    };
  }

  /**
   * Generates sample shipment order data
   */
  static generateOrderData(customOverrides = {}) {
    const origins = ['New Delhi, India', 'Mumbai, India', 'Bengaluru, India', 'Chennai, India'];
    const destinations = ['London, UK', 'New York, USA', 'Singapore', 'Frankfurt, Germany', 'Dubai, UAE'];
    const packages = [
      'High-Precision Sensors',
      'Electronic PCB Modules',
      'Optical Camera Lenses',
      'Aerospace Prototype Parts',
      'Medical Diagnostic Kits',
    ];

    const randomOrigin = origins[Math.floor(Math.random() * origins.length)];
    const randomDest = destinations[Math.floor(Math.random() * destinations.length)];
    const randomPkg = packages[Math.floor(Math.random() * packages.length)];

    return {
      packageName: randomPkg,
      origin: randomOrigin,
      destination: randomDest,
      quantity: 2,
      weight: 4.5,
      length: 30,
      width: 25,
      height: 20,
      fragile: true,
      express: true,
      ...customOverrides,
    };
  }

  /**
   * Exact pricing calculation engine helper to cross-verify client predictions
   * Formula:
   *   Volumetric Weight = (Length * Width * Height) / 5000
   *   Chargeable Weight = Math.max(Actual Weight, Volumetric Weight)
   *   Total Price = Base ($25.00) + (Chargeable Weight * $12.50) + Fragile ($15.00) + Express ($35.00)
   */
  static calculateExpectedPrice(weight, length, width, height, fragile = false, express = false) {
    const actualW = parseFloat(weight) || 0;
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;

    const volumetricW = (l * w * h) / 5000;
    const chargeableW = Math.max(actualW, volumetricW);

    const basePrice = 25.00;
    const weightFee = chargeableW * 12.50;
    const fragileFee = fragile ? 15.00 : 0.00;
    const expressFee = express ? 35.00 : 0.00;

    const total = basePrice + weightFee + fragileFee + expressFee;

    return {
      volumetricWeight: volumetricW.toFixed(2),
      chargeableWeight: chargeableW.toFixed(2),
      totalPrice: total.toFixed(2),
    };
  }

  /**
   * Invalid credentials for negative testing
   */
  static invalidCredentials = {
    email: 'non_existent_user_99999@fake-domain.com',
    password: 'IncorrectPassword!999',
  };

  /**
   * Edge case & Security injection payloads
   */
  static edgeCasePayloads = {
    sqlInjection: "' OR '1'='1",
    scriptInjection: "<script>alert('xss-test')</script>",
  };

  /**
   * Generates a random alphanumeric string
   */
  static randomString(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

module.exports = { TestDataGenerator };
