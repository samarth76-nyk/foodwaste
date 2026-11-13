/**
 * ShareBite Backend Automated Foundation, Database & Smart Features Verification Test
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

const patch = async (path, body, headers = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
};

describe('ShareBite Full Integration: Member 2 Database & Member 4 Smart Features Tests', () => {

  it('1. GET /api/health returns 200 with database operational status', async () => {
    const { status, data } = await get('/health');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.status, 'healthy');
    assert.ok(data.data.databaseStatus);
    assert.ok(data.data.uptimeSeconds >= 0);
  });

  it('2. GET /api/donations returns 200 with list of donations enriched with deadline analysis', async () => {
    const { status, data } = await get('/donations');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length >= 1);
    assert.ok(data.data[0].foodId);
    assert.ok(data.data[0].deadlineAnalysis);
    assert.ok(data.data[0].urgencyTier);
  });

  let createdFoodId = '';

  it('3. POST /api/donations validates payload and stores food donation in database with 201 Created', async () => {
    const validDonation = {
      foodName: 'Fresh Apples & Oranges',
      quantity: 10,
      category: 'Produce',
      donorId: 'usr_001',
      location: {
        address: '77 Market Road',
        city: 'Metro City',
        latitude: 12.9716,
        longitude: 77.5946
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
    createdFoodId = data.data.foodId;
  });

  it('4. GET /api/donations/:foodId retrieves stored donation by ID', async () => {
    const { status, data } = await get(`/donations/${createdFoodId}`);
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.foodId, createdFoodId);
    assert.equal(data.data.foodName, 'Fresh Apples & Oranges');
  });

  it('5. POST /api/donations rejects invalid payload with 400 Bad Request', async () => {
    const invalidDonation = {
      quantity: -5,
      category: 'NonExistentCategory'
    };

    const { status, data } = await post('/donations', invalidDonation);
    assert.equal(status, 400);
    assert.equal(data.success, false);
    assert.ok(data.errors && data.errors.length > 0);
  });

  it('6. GET /api/requests returns 200 with list of requests from database', async () => {
    const { status, data } = await get('/requests');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  let createdRequestId = '';

  it('7. POST /api/requests validates and stores receiver request with 201', async () => {
    const validRequest = {
      foodId: createdFoodId,
      receiverId: 'usr_002',
      requestedQuantity: 4,
      notes: 'For family breakfast distribution'
    };

    const { status, data } = await post('/requests', validRequest);
    assert.equal(status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.requestId);
    assert.equal(data.data.requestedQuantity, 4);
    assert.equal(data.data.requestStatus, 'PENDING');
    createdRequestId = data.data.requestId;
  });

  it('8. PATCH /api/requests/:requestId/status approves request and adjusts food inventory', async () => {
    const { status, data } = await patch(`/requests/${createdRequestId}/status`, {
      requestStatus: 'APPROVED'
    });

    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.requestStatus, 'APPROVED');

    // Verify that food inventory was decremented in database
    const foodRes = await get(`/donations/${createdFoodId}`);
    assert.equal(foodRes.status, 200);
    assert.equal(foodRes.data.data.quantity, 6); // 10 - 4 = 6
  });

  it('9. POST /api/auth/register registers and stores user in database', async () => {
    const testEmail = `newdonor_${Date.now()}@example.com`;
    const { status, data } = await post('/auth/register', {
      name: 'Green Bakery',
      email: testEmail,
      role: 'DONOR',
      phone: '+1-555-019-9999'
    });

    assert.equal(status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.userId);
    assert.equal(data.data.email, testEmail);
  });

  it('10. GET /api/stats/overview returns dynamic database metrics', async () => {
    const { status, data } = await get('/stats/overview');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.totalMealsSaved > 0);
    assert.ok(data.data.co2EmissionsAvoidedKg > 0);
  });

  it('11. GET /api/stats/impact returns 200 with environmental metrics & equivalencies', async () => {
    const { status, data } = await get('/stats/impact');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.coreMetrics.totalMealsRescued > 0);
    assert.ok(data.data.coreMetrics.waterSavedLiters > 0);
    assert.ok(data.data.environmentalEquivalents.carKilometersAvoided);
  });

  it('12. Unmatched endpoint returns 404 with structured error', async () => {
    const { status, data } = await get('/unknown-route-xyz');
    assert.equal(status, 404);
    assert.equal(data.success, false);
    assert.ok(data.message.includes('not found'));
  });

  // =========================================================================
  // MEMBER 4 - SMART FEATURES VERIFICATION TESTS
  // =========================================================================

  it('13. GET /api/matching/donations/:foodId/ngos matches nearby NGOs using Haversine formula', async () => {
    const { status, data } = await get('/matching/donations/food_001/ngos?radius=25');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.matches.length >= 1);
    const topMatch = data.data.matches[0];
    assert.ok(typeof topMatch.distanceKm === 'number');
    assert.ok(topMatch.distanceKm <= 25);
    assert.ok(topMatch.estimatedTransitMinutes > 0);
    assert.ok(typeof topMatch.matchScore === 'number');
  });

  it('14. GET /api/matching/nearby-donations finds active listings for given coordinates', async () => {
    const { status, data } = await get('/matching/nearby-donations?lat=12.9716&lng=77.5946&radius=20');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data.donations));
    assert.ok(data.data.donations.length >= 1);
    assert.ok(typeof data.data.donations[0].distanceKm === 'number');
  });

  it('15. GET /api/matching/ngos lists registered recipient shelters', async () => {
    const { status, data } = await get('/matching/ngos');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length >= 3);
  });

  it('16. GET /api/donations/warnings/expiring-soon filters perishable listings within threshold', async () => {
    const { status, data } = await get('/donations/warnings/expiring-soon?hours=24');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  it('17. POST /api/stats/calculate computes dynamic carbon & water savings for custom target', async () => {
    const { status, data } = await post('/stats/calculate', { mealsSaved: 500 });
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.coreMetrics.totalMealsRescued, 500);
    assert.ok(data.data.coreMetrics.co2EmissionsAvoidedKg > 0);
    assert.ok(data.data.coreMetrics.waterSavedLiters > 0);
  });

  it('18. GET /api/stats/leaderboard returns top community rescue contributors', async () => {
    const { status, data } = await get('/stats/leaderboard');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data.topDonors));
    assert.ok(Array.isArray(data.data.topRecipientNGOs));
    assert.ok(data.data.topDonors[0].mealsRescued > 0);
  });
});
