/**
 * ==============================================================================
 * SHAREBITE - FOOD DONATION SERVICE
 * ==============================================================================
 * RESPONSIBLE TEAMMATE: Teammate 3 / Shreya (Food Donation, Requests & Admin)
 * 
 * CORE FUNCTIONALITY DELIVERABLE:
 * - Food upload & listing management
 * - Status transitions (Available / Requested / Collected)
 * - Portion & quantity tracking
 * - Firestore integration with in-memory dev/mock store fallback
 * ==============================================================================
 */

import { FOOD_STATUS, FOOD_CATEGORY } from '../config/constants.js';
import { db, isFirebaseConfigured } from '../config/firebase.js';
import { ApiError } from '../utils/ApiError.js';

const COLLECTION_NAME = 'food_donations';

/**
 * Helper to parse a numeric portion quantity from number or string
 * e.g. 25 -> 25, "25 portions" -> 25, "10 kg" -> 10
 */
export const parseNumericQuantity = (qty) => {
  if (typeof qty === 'number') return qty > 0 ? qty : 0;
  if (typeof qty === 'string') {
    const match = qty.match(/^([\d.]+)/);
    if (match) {
      const parsed = parseFloat(match[1]);
      return !isNaN(parsed) && parsed > 0 ? parsed : 1;
    }
  }
  return 1;
};

// Stateful in-memory repository for local development & mock testing
const inMemoryDonations = new Map();

// Seed initial mock donations
const seedDonations = [
  {
    foodId: 'food_001',
    foodName: 'Fresh Vegetable Curry & Rice',
    quantity: '25 portions',
    availableQuantity: 25,
    category: FOOD_CATEGORY.COOKED_MEALS,
    donorId: 'donor_cafe_central',
    donorName: 'Community Central Kitchen',
    location: {
      address: '100 University Ave, Community Kitchen',
      city: 'Metro City',
      latitude: 12.9716,
      longitude: 77.5946
    },
    preparedTime: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    pickupDeadline: new Date(Date.now() + 3600 * 1000 * 6).toISOString(),
    status: FOOD_STATUS.AVAILABLE,
    allergens: ['Dairy'],
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
  },
  {
    foodId: 'food_002',
    foodName: 'Artisan Sourdough Loaves & Croissants',
    quantity: '15 packs',
    availableQuantity: 15,
    category: FOOD_CATEGORY.BAKERY,
    donorId: 'donor_bakery_bliss',
    donorName: 'Bakery Bliss',
    location: {
      address: '42 Baker Street',
      city: 'Metro City',
      latitude: 12.9789,
      longitude: 77.6012
    },
    preparedTime: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    pickupDeadline: new Date(Date.now() + 3600 * 1000 * 12).toISOString(),
    status: FOOD_STATUS.AVAILABLE,
    allergens: ['Wheat', 'Gluten'],
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
  }
];

seedDonations.forEach((d) => inMemoryDonations.set(d.foodId, { ...d }));

export const donationService = {
  /**
   * Retrieve all food donations with optional filtering
   * @param {Object} filters
   * @param {string} [filters.category]
   * @param {string} [filters.status]
   * @param {string} [filters.city]
   * @param {string} [filters.donorId]
   * @returns {Promise<Array>} List of food donations
   */
  async getAllDonations(filters = {}) {
    if (isFirebaseConfigured && db.collection) {
      try {
        let query = db.collection(COLLECTION_NAME);
        if (filters.status) query = query.where('status', '==', filters.status.toUpperCase());
        if (filters.category) query = query.where('category', '==', filters.category);
        if (filters.donorId) query = query.where('donorId', '==', filters.donorId);
        
        const snapshot = await query.get();
        let results = snapshot.docs.map((doc) => ({ foodId: doc.id, ...doc.data() }));

        if (filters.city) {
          const cityQuery = filters.city.toLowerCase();
          results = results.filter(
            (item) => item.location?.city && item.location.city.toLowerCase().includes(cityQuery)
          );
        }
        return results;
      } catch (err) {
        console.warn('[DonationService] Firestore query error, falling back to in-memory store:', err.message);
      }
    }

    // In-memory query
    const results = Array.from(inMemoryDonations.values()).filter((d) => {
      if (filters.status && d.status.toUpperCase() !== filters.status.toUpperCase()) return false;
      if (filters.category && d.category !== filters.category) return false;
      if (filters.donorId && d.donorId !== filters.donorId) return false;
      if (filters.city) {
        const cityLower = filters.city.toLowerCase();
        if (!d.location?.city || !d.location.city.toLowerCase().includes(cityLower)) {
          return false;
        }
      }
      return true;
    });

    // Sort newest first
    return results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  /**
   * Retrieve a single food donation by ID
   * @param {string} foodId
   * @returns {Promise<Object|null>}
   */
  async getDonationById(foodId) {
    if (isFirebaseConfigured && db.collection) {
      try {
        const docRef = db.collection(COLLECTION_NAME).doc(foodId);
        const doc = await docRef.get();
        if (doc.exists) {
          return { foodId: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.warn('[DonationService] Firestore fetch error, checking in-memory store:', err.message);
      }
    }

    return inMemoryDonations.get(foodId) || null;
  },

  /**
   * Create / Upload a new food donation listing
   * @param {Object} donationData
   * @returns {Promise<Object>} Created food donation document
   */
  async createDonation(donationData) {
    // Validate business rule: Pickup deadline must be after prepared time
    const prepTime = new Date(donationData.preparedTime).getTime();
    const deadlineTime = new Date(donationData.pickupDeadline).getTime();
    if (deadlineTime <= prepTime) {
      throw ApiError.badRequest('Pickup deadline must be after the prepared time');
    }

    const numericQty = parseNumericQuantity(donationData.quantity);
    const foodId = donationData.foodId || `food_${Date.now()}`;
    const normalizedStatus = (donationData.status || FOOD_STATUS.AVAILABLE).toUpperCase();

    const newDonation = {
      foodId,
      foodName: donationData.foodName.trim(),
      quantity: donationData.quantity,
      availableQuantity: numericQty,
      initialQuantity: numericQty,
      category: donationData.category,
      donorId: donationData.donorId,
      donorName: donationData.donorName || 'Community Donor',
      location: donationData.location,
      preparedTime: donationData.preparedTime,
      pickupDeadline: donationData.pickupDeadline,
      status: normalizedStatus,
      allergens: donationData.allergens?.length ? donationData.allergens : ['None'],
      storageInstructions: donationData.storageInstructions || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db.collection) {
      try {
        await db.collection(COLLECTION_NAME).doc(foodId).set(newDonation);
      } catch (err) {
        console.warn('[DonationService] Firestore save failed, saving in memory:', err.message);
      }
    }

    // Always keep in-memory store synchronized
    inMemoryDonations.set(foodId, { ...newDonation });
    return newDonation;
  },

  /**
   * Update an existing food donation listing
   * @param {string} foodId
   * @param {Object} updateData
   * @param {Object} [userContext]
   * @returns {Promise<Object>} Updated food donation document
   */
  async updateDonation(foodId, updateData, userContext = null) {
    const existing = await this.getDonationById(foodId);
    if (!existing) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' was not found`);
    }

    // Access control check: Only donor owner or ADMIN can modify
    if (userContext && userContext.role !== 'ADMIN' && userContext.userId !== existing.donorId) {
      throw ApiError.forbidden('You are not authorized to edit this food donation');
    }

    // If dates are provided, validate pickupDeadline > preparedTime
    const prepTime = new Date(updateData.preparedTime || existing.preparedTime).getTime();
    const deadlineTime = new Date(updateData.pickupDeadline || existing.pickupDeadline).getTime();
    if (deadlineTime <= prepTime) {
      throw ApiError.badRequest('Pickup deadline must be after the prepared time');
    }

    const updated = {
      ...existing,
      ...updateData,
      foodId,
      updatedAt: new Date().toISOString()
    };

    if (updateData.quantity !== undefined) {
      const parsedQty = parseNumericQuantity(updateData.quantity);
      updated.availableQuantity = parsedQty;
    }

    if (updateData.status) {
      updated.status = updateData.status.toUpperCase();
    }

    if (isFirebaseConfigured && db.collection) {
      try {
        await db.collection(COLLECTION_NAME).doc(foodId).update(updated);
      } catch (err) {
        console.warn('[DonationService] Firestore update error:', err.message);
      }
    }

    inMemoryDonations.set(foodId, updated);
    return updated;
  },

  /**
   * Update status of a donation (Available / Requested / Collected / Claimed)
   * @param {string} foodId
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateDonationStatus(foodId, status) {
    const existing = await this.getDonationById(foodId);
    if (!existing) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' was not found`);
    }

    const normalizedStatus = status.toUpperCase();
    if (!Object.values(FOOD_STATUS).includes(normalizedStatus)) {
      throw ApiError.badRequest(`Invalid status '${status}'. Must be one of: ${Object.values(FOOD_STATUS).join(', ')}`);
    }

    const updated = {
      ...existing,
      status: normalizedStatus,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db.collection) {
      try {
        await db.collection(COLLECTION_NAME).doc(foodId).update({
          status: normalizedStatus,
          updatedAt: updated.updatedAt
        });
      } catch (err) {
        console.warn('[DonationService] Firestore status update error:', err.message);
      }
    }

    inMemoryDonations.set(foodId, updated);
    return updated;
  },

  /**
   * Deduct quantity portions when a request is approved
   * @param {string} foodId
   * @param {number} requestedQty
   * @returns {Promise<Object>}
   */
  async deductQuantity(foodId, requestedQty) {
    const donation = await this.getDonationById(foodId);
    if (!donation) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' was not found`);
    }

    const currentQty = donation.availableQuantity !== undefined
      ? donation.availableQuantity
      : parseNumericQuantity(donation.quantity);

    const remaining = Math.max(0, currentQty - requestedQty);
    const newStatus = remaining === 0 ? FOOD_STATUS.CLAIMED : FOOD_STATUS.REQUESTED;

    const updated = {
      ...donation,
      availableQuantity: remaining,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db.collection) {
      try {
        await db.collection(COLLECTION_NAME).doc(foodId).update({
          availableQuantity: remaining,
          status: newStatus,
          updatedAt: updated.updatedAt
        });
      } catch (err) {
        console.warn('[DonationService] Firestore deduct quantity error:', err.message);
      }
    }

    inMemoryDonations.set(foodId, updated);
    return updated;
  },

  /**
   * Restore quantity portions if a request is cancelled or rejected after approval
   * @param {string} foodId
   * @param {number} qtyToRestore
   * @returns {Promise<Object>}
   */
  async restoreQuantity(foodId, qtyToRestore) {
    const donation = await this.getDonationById(foodId);
    if (!donation) return null;

    const currentQty = donation.availableQuantity || 0;
    const restored = currentQty + qtyToRestore;
    const status = restored > 0 ? FOOD_STATUS.AVAILABLE : donation.status;

    const updated = {
      ...donation,
      availableQuantity: restored,
      status,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db.collection) {
      try {
        await db.collection(COLLECTION_NAME).doc(foodId).update({
          availableQuantity: restored,
          status,
          updatedAt: updated.updatedAt
        });
      } catch (err) {
        console.warn('[DonationService] Firestore restore quantity error:', err.message);
      }
    }

    inMemoryDonations.set(foodId, updated);
    return updated;
  },

  /**
   * Delete or cancel a food donation
   * @param {string} foodId
   * @param {Object} [userContext]
   * @returns {Promise<boolean>}
   */
  async deleteDonation(foodId, userContext = null) {
    const existing = await this.getDonationById(foodId);
    if (!existing) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' was not found`);
    }

    if (userContext && userContext.role !== 'ADMIN' && userContext.userId !== existing.donorId) {
      throw ApiError.forbidden('You are not authorized to delete this food donation');
    }

    if (isFirebaseConfigured && db.collection) {
      try {
        await db.collection(COLLECTION_NAME).doc(foodId).delete();
      } catch (err) {
        console.warn('[DonationService] Firestore delete error:', err.message);
      }
    }

    inMemoryDonations.delete(foodId);
    return true;
  },

  /**
   * Reset in-memory store (useful for clean test environments)
   */
  _resetStore() {
    inMemoryDonations.clear();
    seedDonations.forEach((d) => inMemoryDonations.set(d.foodId, { ...d }));
  }
};

export default donationService;
