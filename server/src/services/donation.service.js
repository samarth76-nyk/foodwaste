/**
 * ==============================================================================
 * SHAREBITE - FOOD DONATION SERVICE
 * ==============================================================================
 * Integration & Smart Features (Member 4)
 * 
 * Manages food listings and integrates real-time pickup deadline warnings,
 * urgency ranking, and status transitions.
 * ==============================================================================
 */

import { FOOD_STATUS, FOOD_CATEGORY } from '../config/constants.js';
import { enrichDonationWithDeadlineWarning, evaluateDeadlineUrgency, URGENCY_TIERS } from '../utils/deadlineUtils.js';

// Realistic sample listings covering the urgency spectrum
const mockDonations = [
  {
    foodId: 'food_001',
    foodName: 'Fresh Vegetable Curry & Steamed Rice',
    quantity: '25 portions',
    category: FOOD_CATEGORY.COOKED_MEALS,
    donorId: 'donor_cafe_central',
    location: {
      address: '100 University Ave, Community Kitchen',
      city: 'Metro City',
      latitude: 12.9716,
      longitude: 77.5946
    },
    preparedTime: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    // 1.5 hours remaining -> CRITICAL urgency
    pickupDeadline: new Date(Date.now() + 3600 * 1000 * 1.5).toISOString(),
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
    // 4 hours remaining -> EXPIRING_SOON warning
    pickupDeadline: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
    status: FOOD_STATUS.AVAILABLE,
    allergens: ['Wheat', 'Gluten']
  },
  {
    foodId: 'food_003',
    foodName: 'Farm Fresh Organic Spinach & Carrots',
    quantity: '20 kg',
    category: FOOD_CATEGORY.PRODUCE,
    donorId: 'donor_green_grocer',
    location: {
      address: '77 Farmers Market Rd',
      city: 'Metro City',
      latitude: 12.9650,
      longitude: 77.5890
    },
    preparedTime: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    // 14 hours remaining -> SAFE window
    pickupDeadline: new Date(Date.now() + 3600 * 1000 * 14).toISOString(),
    status: FOOD_STATUS.AVAILABLE,
    allergens: ['None']
  }
];

export const donationService = {
  /**
   * Retrieve all food donations with optional filtering and live deadline warnings
   * @param {Object} filters
   * @param {string} [filters.category]
   * @param {string} [filters.status]
   * @param {string} [filters.city]
   * @param {string} [filters.urgency]
   * @returns {Promise<Array>} List of food donations with deadline analysis
   */
  async getAllDonations(filters = {}) {
    const enriched = mockDonations.map(enrichDonationWithDeadlineWarning);

    return enriched.filter((d) => {
      if (filters.status && d.status !== filters.status) return false;
      if (filters.category && d.category !== filters.category) return false;
      if (filters.urgency && d.urgencyTier !== filters.urgency) return false;
      return true;
    });
  },

  /**
   * Retrieve a single food donation by ID enriched with deadline analysis
   * @param {string} foodId
   * @returns {Promise<Object|null>}
   */
  async getDonationById(foodId) {
    const found = mockDonations.find((d) => d.foodId === foodId);
    if (!found) return null;
    return enrichDonationWithDeadlineWarning(found);
  },

  /**
   * Get all donations that are expiring soon within specified hours
   * 
   * @param {number} [maxHours=5] Expiration threshold in hours
   * @returns {Promise<Array>} Expiring food listings sorted by urgency
   */
  async getExpiringSoonDonations(maxHours = 5) {
    const all = await this.getAllDonations({ status: FOOD_STATUS.AVAILABLE });

    const expiring = all.filter((d) => {
      const hoursLeft = d.deadlineAnalysis?.hoursRemaining;
      return (
        d.status === FOOD_STATUS.AVAILABLE &&
        !d.deadlineAnalysis?.isExpired &&
        hoursLeft !== undefined &&
        hoursLeft <= maxHours
      );
    });

    // Sort by most urgent first (lowest hours remaining)
    expiring.sort((a, b) => a.deadlineAnalysis.timeRemainingMs - b.deadlineAnalysis.timeRemainingMs);

    return expiring;
  },

  /**
   * Create a new food donation listing
   * @param {Object} donationData
   * @returns {Promise<Object>} Created food donation document
   */
  async createDonation(donationData) {
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

    mockDonations.push(newDonation);
    return enrichDonationWithDeadlineWarning(newDonation);
  },

  /**
   * Update an existing food donation listing
   * @param {string} foodId
   * @param {Object} updateData
   * @returns {Promise<Object>} Updated food donation document
   */
  async updateDonation(foodId, updateData) {
    const donation = await this.getDonationById(foodId);
    const updated = {
      ...(donation || { foodId }),
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return enrichDonationWithDeadlineWarning(updated);
  },

  /**
   * Update status of a donation
   * @param {string} foodId
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateDonationStatus(foodId, status) {
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
    return true;
  }
};

export default donationService;
