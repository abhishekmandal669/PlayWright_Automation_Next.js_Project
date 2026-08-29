const { test, expect } = require('@playwright/test');
const { TestDataGenerator } = require('../../utils/testData');

test.describe('API Contract & Security Endpoint Tests', () => {
  test('API-01: GET /api/auth/demo-info should return SuperAdmin info', async ({ request }) => {
    const res = await request.get('/api/auth/demo-info');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.admin.email).toBe(TestDataGenerator.superAdmin.email);
    expect(body.admin.role).toBe('Admin');
  });

  test('API-02: POST /api/login should return 200 and set HTTP-only cookie for valid credentials', async ({ request }) => {
    const { email, password } = TestDataGenerator.superAdmin;
    const res = await request.post('/api/login', {
      data: { email, password },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.email).toBe(email);
    expect(body.user.passwordHash).toBeUndefined(); // Ensure sensitive hash is never exposed

    // Check Set-Cookie header contains fp_session
    const cookieHeader = res.headers()['set-cookie'];
    expect(cookieHeader).toContain('fp_session');
  });

  test('API-03: POST /api/login should return 401 for invalid credentials', async ({ request }) => {
    const res = await request.post('/api/login', {
      data: { email: 'fake@example.com', password: 'wrong' },
    });
    expect(res.status()).toBe(401);
  });

  test('API-04: POST /api/register should create user and reject duplicate with 409', async ({ request }) => {
    const newUser = TestDataGenerator.generateUser();

    // First creation
    const res1 = await request.post('/api/register', {
      data: { name: newUser.name, email: newUser.email, password: newUser.password },
    });
    expect(res1.status()).toBe(201);

    // Duplicate creation
    const res2 = await request.post('/api/register', {
      data: { name: newUser.name, email: newUser.email, password: newUser.password },
    });
    expect(res2.status()).toBe(409);
  });

  test('API-05: POST /api/orders should calculate volumetric pricing correctly', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        userEmail: 'api_test@example.com',
        userName: 'API Tester',
        origin: 'New Delhi, India',
        destination: 'London, UK',
        packageName: 'Precision Avionics Box',
        quantity: 1,
        weight: 3.0,
        dimensions: { length: 40, width: 30, height: 20 }, // Volumetric: (40*30*20)/5000 = 4.80kg. Chargeable: 4.80kg
        fragile: true,
        express: true,
      },
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.order.trackingId).toMatch(/^TRK-\d+/);
    expect(body.order.status).toBe('PICKUP_PENDING');
    // Expected price: Base ($25) + 4.80*12.50 ($60) + Fragile ($15) + Express ($35) = $135.00
    expect(body.order.totalPrice).toBe(135.00);
  });

  test('API-06: POST /api/users should return 403 Forbidden without Admin session', async ({ request }) => {
    const res = await request.post('/api/users', {
      data: { name: 'Unauthorized User', email: 'unauth@test.com', password: 'password123' },
    });
    expect(res.status()).toBe(403);
  });

  test('API-07: POST /api/logout should clear fp_session cookie', async ({ request }) => {
    const res = await request.post('/api/logout');
    expect(res.status()).toBe(200);
    const cookieHeader = res.headers()['set-cookie'];
    expect(cookieHeader).toContain('fp_session=;');
  });
});
