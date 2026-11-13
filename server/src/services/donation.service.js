/**
 * ==============================================================================
 * SHAREBITE - FOOD DONATION DATABASE & CORE FUNCTIONALITY SERVICE
 * ==============================================================================
 * Integration:
 * - Member 2 (Samarth): Persistent Firestore/Local JSON storage, audit logging
 * - Member 3 (Shreya): Complete donation workflow, food upload, portion deduction, status lifecycle
 * - Member 4: Real-time pickup deadline warnings, urgency ranking
 * ==============================================================================
 */

import { db } from '../config/firebase.js';
import { FOOD_STATUS, FOOD_CATEGORY } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { enrichDonationWithDeadlineWarning, evaluateDeadlineUrgency, URGENCY_TIERS } from '../utils/deadlineUtils.js';

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

export const donationService = {
  /**
   * Retrieve all food donations from database with optional filters and live deadline analysis
   * @param {Object} filters
   * @param {string} [filters.category]
   * @param {string} [filters.status]
   * @param {string} [filters.city]
   * @param {string} [filters.donorId]
   * @param {string} [filters.urgency]
   * @returns {Promise<Array>} List of food donations with deadline analysis
   */
  async getAllDonations(filters = {}) {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    let donations = snapshot.docs.map((d) => d.data());

    const now = new Date();

    // Check expiration and apply in database if passed
    for (const d of donations) {
      if (d.status === FOOD_STATUS.AVAILABLE && d.pickupDeadline) {
        if (new Date(d.pickupDeadline) < now) {
          d.status = FOOD_STATUS.EXPIRED;
          d.updatedAt = new Date().toISOString();
          try {
            await db.collection(COLLECTION_NAME).doc(d.foodId).update({
              status: FOOD_STATUS.EXPIRED,
              updatedAt: d.updatedAt
            });
          } catch (e) {
            // Non-critical background update
          }
        }
      }
    }

    // Apply filtering
    if (filters.status) {
      donations = donations.filter((d) => (d.status || '').toUpperCase() === filters.status.toUpperCase());
    }
    if (filters.category) {
      donations = donations.filter(
        (d) => (d.category || '').toLowerCase() === filters.category.toLowerCase()
      );
    }
    if (filters.city) {
      donations = donations.filter((d) =>
        d.location?.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    if (filters.donorId) {
      donations = donations.filter((d) => d.donorId === filters.donorId);
    }

    // Enrich with deadline analysis
    let enriched = donations.map(enrichDonationWithDeadlineWarning);

    if (filters.urgency) {
      enriched = enriched.filter((d) => d.urgencyTier === filters.urgency);
    }

    // Sort descending by creation date
    enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return enriched;
  },

  /**
   * Retrieve a single food donation by ID enriched with deadline analysis
   * @param {string} foodId
   * @returns {Promise<Object|null>}
   */
  async getDonationById(foodId) {
    if (!foodId) return null;
    const doc = await db.collection(COLLECTION_NAME).doc(foodId).get();
    if (!doc.exists) {
      return null;
    }
    return enrichDonationWithDeadlineWarning(doc.data());
  },

  /**
   * Get all donations that are expiring soon within specified hours
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
   * Create and persist a new food donation listing in the database (Member 3 Core Functionality)
   * @param {Object} donationData
   * @returns {Promise<Object>} Created donation document
   */
  async createDonation(donationData) {
    // Validate deadline > prepared time
    if (donationData.preparedTime && donationData.pickupDeadline) {
      const prep = new Date(donationData.preparedTime).getTime();
      const dead = new Date(donationData.pickupDeadline).getTime();
      if (dead <= prep) {
        throw ApiError.badRequest('Pickup deadline must be after prepared time');
      }
    }

    const numericQty = parseNumericQuantity(donationData.quantity);
    const foodId = donationData.foodId || `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const normalizedStatus = (donationData.status || FOOD_STATUS.AVAILABLE).toUpperCase();

    // Try resolving donor name from users collection if not passed
    let donorName = donationData.donorName;
    if (!donorName && donationData.donorId) {
      try {
        const userDoc = await db.collection('users').doc(donationData.donorId).get();
        if (userDoc.exists) {
          donorName = userDoc.data().name;
        }
      } catch (e) {
        // Fallback default
      }
    }

    const newDonation = {
      foodId,
      foodName: donationData.foodName.trim(),
      quantity: donationData.quantity,
      availableQuantity: numericQty,
      initialQuantity: numericQty,
      category: donationData.category,
      donorId: donationData.donorId,
      donorName: donorName || 'Community Food Donor',
      location: {
        address: donationData.location?.address?.trim() || 'Address not specified',
        city: donationData.location?.city?.trim() || 'Metro City',
        latitude: donationData.location?.latitude ?? 12.9716,
        longitude: donationData.location?.longitude ?? 77.5946
      },
      preparedTime: donationData.preparedTime,
      pickupDeadline: donationData.pickupDeadline,
      status: normalizedStatus,
      allergens: Array.isArray(donationData.allergens) && donationData.allergens.length > 0 ? donationData.allergens : ['None'],
      storageInstructions: donationData.storageInstructions || 'Store in clean food containers',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to database
    await db.collection(COLLECTION_NAME).doc(foodId).set(newDonation);

    // Write audit trail
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      await db.collection('audit_logs').doc(logId).set({
        logId,
        action: 'DONATION_CREATED',
        performedBy: newDonation.donorId,
        targetEntityId: foodId,
        metadata: { foodName: newDonation.foodName, quantity: newDonation.quantity },
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Audit log non-blocking
    }

    return enrichDonationWithDeadlineWarning(newDonation);
  },

  /**
   * Update an existing food donation in the database
   * @param {string} foodId
   * @param {Object} updateData
   * @param {Object} [userContext]
   * @returns {Promise<Object>}
   */
  async updateDonation(foodId, updateData, userContext = null) {
    const existing = await this.getDonationById(foodId);
    if (!existing) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' not found`);
    }

    // Access control check: Only donor owner or ADMIN can modify
    if (userContext && userContext.role !== 'ADMIN' && userContext.userId !== existing.donorId) {
      throw ApiError.forbidden('You are not authorized to edit this food donation');
    }

    // If dates are provided, validate pickupDeadline > preparedTime
    const prepTime = new Date(updateData.preparedTime || existing.preparedTime).getTime();
    const deadlineTime = new Date(updateData.pickupDeadline || existing.pickupDeadline).getTime();
    if (deadlineTime <= prepTime) {
      throw ApiError.badRequest('Pickup deadline must be after prepared time');
    }

    const updated = {
      ...existing,
      ...updateData,
      foodId,
      updatedAt: new Date().toISOString()
    };

    if (updateData.quantity !== undefined) {
      updated.availableQuantity = parseNumericQuantity(updateData.quantity);
    }
    if (updateData.status) {
      updated.status = updateData.status.toUpperCase();
    }

    // Remove computed deadline fields before storing back
    const toStore = { ...updated };
    delete toStore.deadlineAnalysis;
    delete toStore.urgencyTier;
    delete toStore.warningMessage;

    await db.collection(COLLECTION_NAME).doc(foodId).set(toStore, { merge: true });

    return enrichDonationWithDeadlineWarning(updated);
  },

  /**
   * Update donation status in the database (Available / Requested / Collected)
   * @param {string} foodId
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateDonationStatus(foodId, status) {
    const existing = await this.getDonationById(foodId);
    if (!existing) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' not found`);
    }

    const normalizedStatus = status.toUpperCase();
    if (!Object.values(FOOD_STATUS).includes(normalizedStatus)) {
      throw ApiError.badRequest(`Invalid status '${status}'. Must be one of: ${Object.values(FOOD_STATUS).join(', ')}`);
    }

    const updatedAt = new Date().toISOString();
    await db.collection(COLLECTION_NAME).doc(foodId).update({
      status: normalizedStatus,
      updatedAt
    });

    const updated = {
      ...existing,
      status: normalizedStatus,
      updatedAt
    };

    return enrichDonationWithDeadlineWarning(updated);
  },

  /**
   * Deduct quantity portions when a request is approved (Member 3 Core Functionality)
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
    const updatedAt = new Date().toISOString();

    let updatedQuantity = remaining;
    if (typeof donation.quantity === 'string') {
      const match = donation.quantity.match(/^[\d.]+(\s*.*)$/);
      if (match && match[1]) {
        updatedQuantity = `${remaining}${match[1]}`;
      }
    }

    await db.collection(COLLECTION_NAME).doc(foodId).update({
      quantity: typeof donation.quantity === 'number' ? remaining : updatedQuantity,
      availableQuantity: remaining,
      status: newStatus,
      updatedAt
    });

    const updated = {
      ...donation,
      quantity: typeof donation.quantity === 'number' ? remaining : updatedQuantity,
      availableQuantity: remaining,
      status: newStatus,
      updatedAt
    };

    return enrichDonationWithDeadlineWarning(updated);
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
    const updatedAt = new Date().toISOString();

    let updatedQuantity = restored;
    if (typeof donation.quantity === 'string') {
      const match = donation.quantity.match(/^[\d.]+(\s*.*)$/);
      if (match && match[1]) {
        updatedQuantity = `${restored}${match[1]}`;
      }
    }

    await db.collection(COLLECTION_NAME).doc(foodId).update({
      quantity: typeof donation.quantity === 'number' ? restored : updatedQuantity,
      availableQuantity: restored,
      status,
      updatedAt
    });

    const updated = {
      ...donation,
      quantity: typeof donation.quantity === 'number' ? restored : updatedQuantity,
      availableQuantity: restored,
      status,
      updatedAt
    };

    return enrichDonationWithDeadlineWarning(updated);
  },

  /**
   * Delete or remove food donation from the database
   * @param {string} foodId
   * @param {Object} [userContext]
   * @returns {Promise<boolean>}
   */
  async deleteDonation(foodId, userContext = null) {
    const existing = await this.getDonationById(foodId);
    if (!existing) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' not found`);
    }

    if (userContext && userContext.role !== 'ADMIN' && userContext.userId !== existing.donorId) {
      throw ApiError.forbidden('You are not authorized to delete this food donation');
    }

    await db.collection(COLLECTION_NAME).doc(foodId).delete();

    // Write audit log
    try {
      const logId = `log_${Date.now()}`;
      await db.collection('audit_logs').doc(logId).set({
        logId,
        action: 'DONATION_DELETED',
        performedBy: existing.donorId,
        targetEntityId: foodId,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Non-blocking
    }

    return true;
  }
};

export default donationService;
