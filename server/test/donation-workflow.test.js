/**
 * ==============================================================================
 * COMPLETE DONATION WORKFLOW TEST SUITE
 * ==============================================================================
 * Tests the complete donation workflow:
 * 1. Implement food upload (Donation creation)
 * 2. Implement request food (Request submission with availability checks)
 * 3. Add accept / reject functionality (Donor approvals and rejections)
 * 4. Update food status (Available -> Requested -> Collected)
 * ==============================================================================
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { donationService } from '../src/services/donation.service.js';
import { requestService } from '../src/services/request.service.js';
import { FOOD_STATUS, REQUEST_STATUS } from '../src/config/constants.js';

let server;
let baseUrl = '';

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      console.log(`[Donation Workflow Test Suite] Server initialized at ${baseUrl}`);
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

describe('Complete Donation Workflow', () => {
  let createdFoodId = '';
  let createdRequestId = '';
  const testDonorId = 'usr_donor_test';
  const testReceiverId = 'usr_receiver_shelter';

  // --- 1. FOOD UPLOAD ---
  it('1.1 Donor can upload a new food donation listing (Status: AVAILABLE)', async () => {
    const foodPayload = {
      foodName: 'Fresh Vegetable Pulao & Raita',
      quantity: '30 portions',
      category: 'Cooked Meals',
      donorId: testDonorId,
      location: {
        address: '15 Gandhi Road, Community Kitchen',
        city: 'Bangalore'
      },
      preparedTime: new Date(Date.now() - 3600000).toISOString(),
      pickupDeadline: new Date(Date.now() + 86400000).toISOString(),
      status: 'AVAILABLE',
      allergens: ['Dairy']
    };

    const { status, data } = await post('/donations', foodPayload);
    assert.equal(status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.foodId);
    assert.equal(data.data.foodName, foodPayload.foodName);
    assert.equal(data.data.status, FOOD_STATUS.AVAILABLE);
    assert.equal(data.data.availableQuantity, 30);

    createdFoodId = data.data.foodId;
  });

  it('1.2 Food upload rejects invalid date ordering (pickupDeadline <= preparedTime)', async () => {
    const invalidDates = {
      foodName: 'Expired Soup',
      quantity: '10 portions',
      category: 'Cooked Meals',
      donorId: testDonorId,
      location: { address: 'Test St', city: 'Bangalore' },
      preparedTime: new Date(Date.now() + 3600000).toISOString(),
      pickupDeadline: new Date(Date.now() - 3600000).toISOString(), // earlier than prepared!
      status: 'AVAILABLE'
    };

    const { status, data } = await post('/donations', invalidDates);
    assert.equal(status, 400);
    assert.equal(data.success, false);
  });

  // --- 2. REQUEST FOOD ---
  it('2.1 Receiver can request food from available listing (Status transitions to REQUESTED)', async () => {
    const requestPayload = {
      foodId: createdFoodId,
      receiverId: testReceiverId,
      requestedQuantity: 15,
      notes: 'Need 15 portions for evening shelter meal distribution.'
    };

    const { status, data } = await post('/requests', requestPayload);
    assert.equal(status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.requestId);
    assert.equal(data.data.requestedQuantity, 15);
    assert.equal(data.data.requestStatus, REQUEST_STATUS.PENDING);

    createdRequestId = data.data.requestId;

    // Verify food status automatically transitioned to REQUESTED
    const foodRes = await get(`/donations/${createdFoodId}`);
    assert.equal(foodRes.status, 200);
    assert.equal(foodRes.data.data.status, FOOD_STATUS.REQUESTED);
  });

  it('2.2 Request fails when requested quantity exceeds available quantity', async () => {
    const excessivePayload = {
      foodId: createdFoodId,
      receiverId: 'usr_another_receiver',
      requestedQuantity: 999
    };

    const { status, data } = await post('/requests', excessivePayload);
    assert.equal(status, 400);
    assert.equal(data.success, false);
    assert.ok(data.message.includes('exceeds available portions'));
  });

  it('2.3 Receiver cannot submit duplicate pending request for same food', async () => {
    const duplicatePayload = {
      foodId: createdFoodId,
      receiverId: testReceiverId,
      requestedQuantity: 5
    };

    const { status, data } = await post('/requests', duplicatePayload);
    assert.equal(status, 409);
    assert.equal(data.success, false);
    assert.ok(data.message.includes('already have a pending request'));
  });

  // --- 3. ACCEPT / REJECT FUNCTIONALITY ---
  it('3.1 Donor can accept/approve a food request (portions deducted)', async () => {
    const { status, data } = await post(`/requests/${createdRequestId}/accept`, {});
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.requestStatus, REQUEST_STATUS.APPROVED);
    assert.ok(data.data.approvedAt);

    // Verify remaining food quantity was decremented by 15 (30 - 15 = 15)
    const foodRes = await get(`/donations/${createdFoodId}`);
    assert.equal(foodRes.status, 200);
    assert.equal(foodRes.data.data.availableQuantity, 15);
  });

  it('3.2 Donor can reject a second food request with optional rejection reason', async () => {
    // Create another request to test reject
    const secondReqPayload = {
      foodId: createdFoodId,
      receiverId: 'usr_shelter_two',
      requestedQuantity: 5,
      notes: 'Second request'
    };
    const createRes = await post('/requests', secondReqPayload);
    assert.equal(createRes.status, 201);
    const secondRequestId = createRes.data.data.requestId;

    // Reject it
    const { status, data } = await post(`/requests/${secondRequestId}/reject`, {
      rejectionReason: 'Kitchen closing early today'
    });
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.requestStatus, REQUEST_STATUS.REJECTED);
    assert.equal(data.data.rejectionReason, 'Kitchen closing early today');
  });

  // --- 4. UPDATE FOOD STATUS (Available / Requested / Collected) ---
  it('4.1 Can explicitly update food status to COLLECTED via PATCH /api/donations/:foodId/status', async () => {
    const { status, data } = await patch(`/donations/${createdFoodId}/status`, {
      status: 'COLLECTED'
    });
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.status, FOOD_STATUS.COLLECTED);

    // Fetch food details and confirm status
    const foodRes = await get(`/donations/${createdFoodId}`);
    assert.equal(foodRes.data.data.status, FOOD_STATUS.COLLECTED);
  });

  it('4.2 Marking request COLLECTED completes the request and food workflow', async () => {
    const { status, data } = await patch(`/requests/${createdRequestId}/status`, {
      requestStatus: 'COLLECTED'
    });
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.requestStatus, REQUEST_STATUS.COLLECTED);
    assert.ok(data.data.collectedAt);
  });

  // --- 5. END-TO-END WORKFLOW SUMMARY ---
  it('5.1 End-to-end full donation workflow succeeds from upload to collection', async () => {
    // A. Upload food
    const uploadRes = await post('/donations', {
      foodName: 'End-to-End Fresh Bagels',
      quantity: '10 pieces',
      category: 'Bakery',
      donorId: 'donor_e2e',
      location: { address: '123 Test Ave', city: 'Metro City' },
      preparedTime: new Date().toISOString(),
      pickupDeadline: new Date(Date.now() + 36000000).toISOString(),
      status: 'AVAILABLE'
    });
    assert.equal(uploadRes.status, 201);
    const foodId = uploadRes.data.data.foodId;
    assert.equal(uploadRes.data.data.status, 'AVAILABLE');

    // B. Request all remaining portions (10)
    const reqRes = await post('/requests', {
      foodId,
      receiverId: 'receiver_e2e',
      requestedQuantity: 10
    });
    assert.equal(reqRes.status, 201);
    const reqId = reqRes.data.data.requestId;

    // C. Accept request -> availableQuantity becomes 0 -> status becomes CLAIMED
    const acceptRes = await post(`/requests/${reqId}/accept`, {});
    assert.equal(acceptRes.status, 200);

    const claimedFood = await get(`/donations/${foodId}`);
    assert.equal(claimedFood.data.data.availableQuantity, 0);
    assert.equal(claimedFood.data.data.status, 'CLAIMED');

    // D. Mark collected -> food and request both become COLLECTED
    const collectRes = await patch(`/requests/${reqId}/status`, { requestStatus: 'COLLECTED' });
    assert.equal(collectRes.status, 200);

    const collectedFood = await get(`/donations/${foodId}`);
    assert.equal(collectedFood.data.data.status, 'COLLECTED');
  });
});
