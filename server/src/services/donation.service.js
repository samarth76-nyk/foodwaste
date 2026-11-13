/**
 * ==============================================================================
 * SHAREBITE - FOOD DONATION SERVICE STUB
 * ==============================================================================
 * RESPONSIBLE TEAMMATE: Teammate 3 (Food Donation, Requests & Admin Functionality)
 * 
 * INSTRUCTIONS FOR TEAMMATE 3:
 * 1. Implement Firestore queries using the `db` client exported from config/firebase.js.
 * 2. Food collection name: 'food_donations'
 * 3. Enforce business rules:
 *    - Pickup deadline must be after prepared time.
 *    - Only the original donor or an ADMIN can edit/cancel a donation.
 *    - Update status to 'CLAIMED' when approved requests equal available quantity.
 *    - Filter out expired donations based on pickupDeadline <= current timestamp.
 * ==============================================================================
 */

import { FOOD_STATUS, FOOD_CATEGORY } from '../config/constants.js';

// Sample mock data conforming strictly to the Food Data Contract
const mockDonations = [
  {
    foodId: 'food_001',
    foodName: 'Fresh Vegetable Curry & Rice',
    quantity: '25 portions',
    category: FOOD_CATEGORY.COOKED_MEALS,
    donorId: 'donor_cafe_central',
    location: {
      address: '100 University Ave, Community Kitchen',
      city: 'Metro City',
      latitude: 12.9716,
      longitude: 77.5946
    },
    preparedTime: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    pickupDeadline: new Date(Date.now() + 3600 * 1000 * 6).toISOString(),
    status: FOOD_STATUS.AVAILABLE,
    allergens: ['Dairy']
  },
  {
    foodId: 'food_002',
    foodName: 'Artisan Sourdough Loaves & Croissants',
    quantity: '15 packs',
    category: FOOD_CATEGORY.BAKERY,
    donorId: 'donor_bakery_bliss',
    location: {
      address: '42 Baker Street',
      city: 'Metro City',
      latitude: 12.9789,
      longitude: 77.6012
    },
    preparedTime: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    pickupDeadline: new Date(Date.now() + 3600 * 1000 * 12).toISOString(),
    status: FOOD_STATUS.AVAILABLE,
    allergens: ['Wheat', 'Gluten']
  }
];

export const donationService = {
  /**
   * Retrieve all food donations with optional filtering
   * @param {Object} filters
   * @param {string} [filters.category]
   * @param {string} [filters.status]
   * @param {string} [filters.city]
   * @returns {Promise<Array>} List of food donations
   */
  async getAllDonations(filters = {}) {
    // TODO: Teammate 3 - Replace with Firestore query:
    // let query = db.collection('food_donations');
    // if (filters.status) query = query.where('status', '==', filters.status);
    // ...
    return mockDonations.filter((d) => {
      if (filters.status && d.status !== filters.status) return false;
      if (filters.category && d.category !== filters.category) return false;
      return true;
    });
  },

  /**
   * Retrieve a single food donation by ID
   * @param {string} foodId
   * @returns {Promise<Object|null>}
   */
  async getDonationById(foodId) {
    // TODO: Teammate 3 - Query db.collection('food_donations').doc(foodId).get()
    const found = mockDonations.find((d) => d.foodId === foodId);
    return found || null;
  },

  /**
   * Create a new food donation listing
   * @param {Object} donationData
   * @returns {Promise<Object>} Created food donation document
   */
  async createDonation(donationData) {
    // TODO: Teammate 3 - Write to db.collection('food_donations').add(newDonation)
    const newDonation = {
      foodId: `food_${Date.now()}`,
      foodName: donationData.foodName,
      quantity: donationData.quantity,
      category: donationData.category,
      donorId: donationData.donorId,
      location: donationData.location,
      preparedTime: donationData.preparedTime,
      pickupDeadline: donationData.pickupDeadline,
      status: donationData.status || FOOD_STATUS.AVAILABLE,
      allergens: donationData.allergens || ['None'],
      createdAt: new Date().toISOString()
    };
    return newDonation;
  },

  /**
   * Update an existing food donation listing
   * @param {string} foodId
   * @param {Object} updateData
   * @returns {Promise<Object>} Updated food donation document
   */
  async updateDonation(foodId, updateData) {
    // TODO: Teammate 3 - Update db.collection('food_donations').doc(foodId).update(updateData)
    const donation = await this.getDonationById(foodId);
    return {
      ...(donation || { foodId }),
      ...updateData,
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Update status of a donation (e.g. AVAILABLE -> CLAIMED -> COMPLETED)
   * @param {string} foodId
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateDonationStatus(foodId, status) {
    // TODO: Teammate 3 - Call db.collection('food_donations').doc(foodId).update({ status })
    return {
      foodId,
      status,
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Soft-delete or cancel a food donation
   * @param {string} foodId
   * @returns {Promise<boolean>}
   */
  async deleteDonation(foodId) {
    // TODO: Teammate 3 - Call db.collection('food_donations').doc(foodId).delete() or soft delete
    return true;
  }
};

export default donationService;
