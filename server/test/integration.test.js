/**
 * ShareBite Backend Automated Foundation & Route Verification Test
 * Runs against the Express app directly using Node.js built-in test runner
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

let server;
let baseUrl = '';

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      console.log(`[Test Suite] Server initialized at ${baseUrl}`);
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const get = async (path, headers = {}) => {
  const res = await fetch(`${baseUrl}${path}`, { headers });
  const data = await res.json();
  return { status: res.status, data };
};

const post = async (path, body, headers = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
};

describe('ShareBite Foundation API Tests', () => {

  it('1. GET /api/health returns 200 with operational status', async () => {
    const { status, data } = await get('/health');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.status, 'healthy');
    assert.ok(data.data.uptimeSeconds >= 0);
  });

  it('2. GET /api/donations returns 200 with list of donations', async () => {
    const { status, data } = await get('/donations');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length >= 1);
    assert.ok(data.data[0].foodId);
    assert.ok(data.data[0].foodName);
    assert.ok(data.data[0].location);
  });

  it('3. POST /api/donations validates payload and returns 201 Created', async () => {
    const validDonation = {
      foodName: 'Fresh Apples & Oranges',
      quantity: '10 kg',
      category: 'Produce',
      donorId: 'test_donor_123',
      location: {
        address: '77 Market Road',
        city: 'Metro City'
      },
      preparedTime: new Date().toISOString(),
      pickupDeadline: new Date(Date.now() + 86400000).toISOString(),
      status: 'AVAILABLE',
      allergens: ['None']
    };

    const { status, data } = await post('/donations', validDonation);
    assert.equal(status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.foodId);
    assert.equal(data.data.foodName, validDonation.foodName);
  });

  it('4. POST /api/donations rejects invalid payload with 400 Bad Request', async () => {
    const invalidDonation = {
      quantity: -5,
      category: 'NonExistentCategory'
    };

    const { status, data } = await post('/donations', invalidDonation);
    assert.equal(status, 400);
    assert.equal(data.success, false);
    assert.ok(data.errors && data.errors.length > 0);
  });

  it('5. GET /api/requests returns 200 with list of requests', async () => {
    const { status, data } = await get('/requests');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  it('6. POST /api/requests validates and creates food request with 201', async () => {
    const validRequest = {
      foodId: 'food_001',
      receiverId: 'shelter_alpha',
      requestedQuantity: 5
    };

    const { status, data } = await post('/requests', validRequest);
    assert.equal(status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.requestId);
    assert.equal(data.data.requestedQuantity, 5);
  });

  it('7. GET /api/stats/overview returns 200 with platform metrics', async () => {
    const { status, data } = await get('/stats/overview');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.totalMealsSaved > 0);
  });

  it('8. GET /api/stats/impact returns 200 with environmental metrics', async () => {
    const { status, data } = await get('/stats/impact');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.totalKgFoodSaved > 0);
    assert.ok(data.data.co2EmissionsAvoidedKg > 0);
  });

  it('9. GET /api/admin/users succeeds with mock admin user', async () => {
    const { status, data } = await get('/admin/users');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  it('10. Unmatched endpoint returns 404 with structured error', async () => {
    const { status, data } = await get('/unknown-route-xyz');
    assert.equal(status, 404);
    assert.equal(data.success, false);
    assert.ok(data.message.includes('not found'));
  });
});
