/**
 * Test Data Generator Utility
 */
class TestDataGenerator {
  /**
   * Generates unique user object for testing registration
   */
  static generateUser() {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return {
      name: `Automation User ${randomNum}`,
      email: `testuser_${timestamp}_${randomNum}@qa.local`,
      password: `SecurePass@${randomNum}`,
    };
  }

  /**
   * Pre-seeded demo credentials
   */
  static demoCredentials = {
    email: 'user@example.com',
    password: 'password123',
    name: 'Demo Admin',
  };

  /**
   * Invalid credentials for negative testing
   */
  static invalidCredentials = {
    email: 'unknown_user_8888@test.com',
    password: 'WrongPassword999!',
  };

  /**
   * Edge case payload strings
   */
  static edgeCasePayloads = {
    sqlInjection: "' OR '1'='1",
    scriptInjection: "<script>alert('xss')</script>",
    longString: 'A'.repeat(150),
    specialChars: 'User!@#$%^&*()_+~`',
  };
}

module.exports = { TestDataGenerator };
