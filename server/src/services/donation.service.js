/**
 * ==============================================================================
 * SHAREBITE - FOOD DONATION DATABASE SERVICE
 * ==============================================================================
 * Responsible Teammate: Samarth (Member 2 – Backend & Database)
 *
 * Implements:
 * 1. Persistent CRUD operations in Firestore 'food_donations' collection
 * 2. Food availability query filtering (category, status, city, donorId)
 * 3. Automatic expiry evaluation based on pickupDeadline timestamps
 * 4. Audit log tracking for donation lifecycle changes
 * ==============================================================================
 */

import { db } from '../config/firebase.js';
import { FOOD_STATUS, FOOD_CATEGORY } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

export const donationService = {
  /**
   * Retrieve all food donations from database with optional filters
   * @param {Object} filters
   * @param {string} [filters.category]
   * @param {string} [filters.status]
   * @param {string} [filters.city]
   * @param {string} [filters.donorId]
   * @returns {Promise<Array>}
   */
  async getAllDonations(filters = {}) {
    const snapshot = await db.collection('food_donations').get();
    let donations = snapshot.docs.map((d) => d.data());

    const now = new Date();

    // Check expiration and apply in database if passed
    for (const d of donations) {
      if (d.status === FOOD_STATUS.AVAILABLE && d.pickupDeadline) {
        if (new Date(d.pickupDeadline) < now) {
          d.status = FOOD_STATUS.EXPIRED;
          d.updatedAt = new Date().toISOString();
          try {
            await db.collection('food_donations').doc(d.foodId).update({
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
      donations = donations.filter((d) => d.status.toUpperCase() === filters.status.toUpperCase());
    }
    if (filters.category) {
      donations = donations.filter(
        (d) => d.category.toLowerCase() === filters.category.toLowerCase()
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

    // Sort descending by creation date
    donations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return donations;
  },

  /**
   * Retrieve single donation by foodId
   * @param {string} foodId
   * @returns {Promise<Object|null>}
   */
  async getDonationById(foodId) {
    if (!foodId) return null;
    const doc = await db.collection('food_donations').doc(foodId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data();
  },

  /**
   * Create and persist a new food donation listing in the database
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

    const foodId = donationData.foodId || `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

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
      category: donationData.category,
      donorId: donationData.donorId,
      donorName: donorName || 'Community Food Donor',
      location: {
        address: donationData.location.address.trim(),
        city: donationData.location.city.trim(),
        latitude: donationData.location.latitude ?? 12.9716,
        longitude: donationData.location.longitude ?? 77.5946
      },
      preparedTime: donationData.preparedTime,
      pickupDeadline: donationData.pickupDeadline,
      status: donationData.status || FOOD_STATUS.AVAILABLE,
      allergens: Array.isArray(donationData.allergens) && donationData.allergens.length > 0 ? donationData.allergens : ['None'],
      storageInstructions: donationData.storageInstructions || 'Store in clean food containers',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore
    await db.collection('food_donations').doc(foodId).set(newDonation);

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

    return newDonation;
  },

  /**
   * Update an existing food donation in the database
   * @param {string} foodId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateDonation(foodId, updateData) {
    const existing = await this.getDonationById(foodId);
    if (!existing) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' not found`);
    }

    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await db.collection('food_donations').doc(foodId).set(updated, { merge: true });

    return updated;
  },

  /**
   * Update donation status in the database
   * @param {string} foodId
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateDonationStatus(foodId, status) {
    const existing = await this.getDonationById(foodId);
    if (!existing) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' not found`);
    }

    if (!Object.values(FOOD_STATUS).includes(status)) {
      throw ApiError.badRequest(`Invalid status '${status}'. Must be one of: ${Object.values(FOOD_STATUS).join(', ')}`);
    }

    const updatedAt = new Date().toISOString();
    await db.collection('food_donations').doc(foodId).update({
      status,
      updatedAt
    });

    return {
      ...existing,
      status,
      updatedAt
    };
  },

  /**
   * Delete or remove food donation from the database
   * @param {string} foodId
   * @returns {Promise<boolean>}
   */
  async deleteDonation(foodId) {
    const existing = await this.getDonationById(foodId);
    if (!existing) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' not found`);
    }

    await db.collection('food_donations').doc(foodId).delete();

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
