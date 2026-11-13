/**
 * ==============================================================================
 * SHAREBITE - NEARBY NGO MATCHING SERVICE
 * ==============================================================================
 * Member 4 - Smart Features & Integration
 * 
 * Implements proximity-based algorithmic matching between perishable food
 * donations and registered recipient NGOs / shelters using Haversine distance.
 * ==============================================================================
 */

import { calculateDistanceKm, estimateTransitMinutes, isValidCoordinate } from '../utils/geoUtils.js';
import { evaluateDeadlineUrgency } from '../utils/deadlineUtils.js';
import { donationService } from './donation.service.js';
import { ApiError } from '../utils/ApiError.js';
import { FOOD_CATEGORY } from '../config/constants.js';

// Registered NGOs & Shelters Directory with verified GPS coordinates (Metro City Region)
const registeredNGOs = [
  {
    ngoId: 'ngo_hope_shelter',
    name: 'Hope Community Shelter',
    category: 'Homeless Shelter & Kitchen',
    contactPerson: 'Sarah Jenkins',
    email: 'sarah@hopeshelter.org',
    phone: '+1-555-234-5678',
    capacityPortionsPerDay: 150,
    location: {
      address: '142 Central Ave',
      city: 'Metro City',
      latitude: 12.9750,
      longitude: 77.5990
    },
    acceptedCategories: [
      FOOD_CATEGORY.COOKED_MEALS,
      FOOD_CATEGORY.PRODUCE,
      FOOD_CATEGORY.BAKERY,
      FOOD_CATEGORY.PACKAGED_GOODS
    ]
  },
  {
    ngoId: 'ngo_city_pantry',
    name: 'City Care Food Pantry',
    category: 'Community Food Bank',
    contactPerson: 'David Miller',
    email: 'david@citycarepantry.org',
    phone: '+1-555-876-5432',
    capacityPortionsPerDay: 300,
    location: {
      address: '88 North Boulevard',
      city: 'Metro City',
      latitude: 12.9860,
      longitude: 77.6080
    },
    acceptedCategories: [
      FOOD_CATEGORY.PRODUCE,
      FOOD_CATEGORY.BAKERY,
      FOOD_CATEGORY.DAIRY,
      FOOD_CATEGORY.PACKAGED_GOODS
    ]
  },
  {
    ngoId: 'ngo_grace_care',
    name: 'Grace Orphanage & Youth Mission',
    category: 'Children Home',
    contactPerson: 'Sister Mary',
    email: 'contact@gracecare.org',
    phone: '+1-555-345-6789',
    capacityPortionsPerDay: 80,
    location: {
      address: '210 South Park Rd',
      city: 'Metro City',
      latitude: 12.9550,
      longitude: 77.5850
    },
    acceptedCategories: [
      FOOD_CATEGORY.COOKED_MEALS,
      FOOD_CATEGORY.DAIRY,
      FOOD_CATEGORY.BAKERY,
      FOOD_CATEGORY.PRODUCE
    ]
  },
  {
    ngoId: 'ngo_metro_relief',
    name: 'Metro Emergency Relief Kitchen',
    category: 'Disaster & Relief Center',
    contactPerson: 'Marcus Thorne',
    email: 'marcus@metrorelief.org',
    phone: '+1-555-901-2345',
    capacityPortionsPerDay: 500,
    location: {
      address: '50 Industrial Ring Road',
      city: 'Metro City',
      latitude: 12.9980,
      longitude: 77.6350
    },
    acceptedCategories: Object.values(FOOD_CATEGORY)
  },
  {
    ngoId: 'ngo_green_pastures',
    name: 'Green Pastures Elder Sanctuary',
    category: 'Senior Citizen Care',
    contactPerson: 'Elena Rostova',
    email: 'elena@greenpastures.org',
    phone: '+1-555-678-9012',
    capacityPortionsPerDay: 60,
    location: {
      address: '15 West Lakeside Way',
      city: 'Metro City',
      latitude: 12.9420,
      longitude: 77.5620
    },
    acceptedCategories: [
      FOOD_CATEGORY.COOKED_MEALS,
      FOOD_CATEGORY.PRODUCE,
      FOOD_CATEGORY.DAIRY
    ]
  }
];

export const matchingService = {
  /**
   * Get all registered recipient NGOs
   * @returns {Array} List of NGOs
   */
  getAllNGOs() {
    return registeredNGOs;
  },

  /**
   * Find nearby NGOs suitable for picking up a specific food donation
   * 
   * @param {string} foodId Unique donation identifier
   * @param {number} [maxRadiusKm=20] Search radius in kilometers
   * @returns {Promise<Object>} Matched NGOs sorted by distance
   */
  async findNearbyNGOsForDonation(foodId, maxRadiusKm = 20) {
    const donation = await donationService.getDonationById(foodId);
    if (!donation) {
      throw ApiError.notFound(`Food donation with ID '${foodId}' does not exist.`);
    }

    const { location, category, pickupDeadline, preparedTime } = donation;

    if (!location || !isValidCoordinate(location.latitude, location.longitude)) {
      throw ApiError.badRequest(
        `Donation '${foodId}' does not contain valid GPS coordinates (latitude, longitude).`
      );
    }

    // Evaluate deadline urgency
    const urgency = evaluateDeadlineUrgency(pickupDeadline, preparedTime);

    // Calculate distance and match suitability for each NGO
    const matches = [];

    for (const ngo of registeredNGOs) {
      const distanceKm = calculateDistanceKm(
        location.latitude,
        location.longitude,
        ngo.location.latitude,
        ngo.location.longitude
      );

      // Check distance filter
      if (distanceKm === null || distanceKm > maxRadiusKm) {
        continue;
      }

      // Check category match
      const categoryMatch = !ngo.acceptedCategories || ngo.acceptedCategories.includes(category);

      // Estimate transit time
      const transitMinutes = estimateTransitMinutes(distanceKm);

      // Transit feasibility vs pickup deadline
      const isTransitFeasible =
        urgency.isExpired ? false : transitMinutes < (urgency.minutesRemaining || Infinity);

      // Calculate composite Match Score (0 to 100)
      // Factors: Proximity (50%), Category Match (30%), Capacity (20%)
      const proximityScore = Math.max(0, Math.round((1 - distanceKm / maxRadiusKm) * 50));
      const categoryScore = categoryMatch ? 30 : 0;
      const capacityScore = 20; // Default capacity baseline
      const totalMatchScore = proximityScore + categoryScore + capacityScore;

      matches.push({
        ngoId: ngo.ngoId,
        name: ngo.name,
        category: ngo.category,
        contactPerson: ngo.contactPerson,
        email: ngo.email,
        phone: ngo.phone,
        location: ngo.location,
        distanceKm,
        estimatedTransitMinutes: transitMinutes,
        isTransitFeasible,
        categoryMatch,
        matchScore: totalMatchScore
      });
    }

    // Sort by proximity (shortest distance first)
    matches.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      donation: {
        foodId: donation.foodId,
        foodName: donation.foodName,
        category: donation.category,
        quantity: donation.quantity,
        donorLocation: donation.location,
        pickupDeadline: donation.pickupDeadline,
        urgencyTier: urgency.urgencyTier,
        timeRemainingFormatted: urgency.formattedRemaining
      },
      searchRadiusKm: Number(maxRadiusKm),
      totalMatches: matches.length,
      matches
    };
  },

  /**
   * Find nearby active food donations for a specific NGO location
   * 
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} [maxRadiusKm=15]
   * @param {string} [categoryFilter]
   * @returns {Promise<Object>}
   */
  async findNearbyDonationsForLocation(latitude, longitude, maxRadiusKm = 15, categoryFilter = null) {
    if (!isValidCoordinate(latitude, longitude)) {
      throw ApiError.badRequest('Invalid latitude or longitude coordinates provided.');
    }

    const allDonations = await donationService.getAllDonations({ status: 'AVAILABLE' });
    const nearbyDonations = [];

    for (const donation of allDonations) {
      if (categoryFilter && donation.category !== categoryFilter) {
        continue;
      }

      if (!donation.location || !isValidCoordinate(donation.location.latitude, donation.location.longitude)) {
        continue;
      }

      const distanceKm = calculateDistanceKm(
        latitude,
        longitude,
        donation.location.latitude,
        donation.location.longitude
      );

      if (distanceKm <= maxRadiusKm) {
        const transitMinutes = estimateTransitMinutes(distanceKm);
        const urgency = evaluateDeadlineUrgency(donation.pickupDeadline, donation.preparedTime);

        nearbyDonations.push({
          ...donation,
          distanceKm,
          estimatedTransitMinutes: transitMinutes,
          deadlineUrgency: urgency
        });
      }
    }

    // Sort by nearest first
    nearbyDonations.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      searchedLocation: { latitude, longitude },
      searchRadiusKm: Number(maxRadiusKm),
      totalFound: nearbyDonations.length,
      donations: nearbyDonations
    };
  }
};

export default matchingService;
