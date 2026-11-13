import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { matchingService } from '../services/matching.service.js';

/**
 * ==============================================================================
 * NEARBY NGO MATCHING CONTROLLER
 * ==============================================================================
 */

export const getNearbyNGOsForDonation = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const radiusKm = req.query.radius ? parseFloat(req.query.radius) : 20;

  if (isNaN(radiusKm) || radiusKm <= 0) {
    throw ApiError.badRequest('Query parameter "radius" must be a positive number.');
  }

  const matchResult = await matchingService.findNearbyNGOsForDonation(foodId, radiusKm);
  return ApiResponse.success(
    res,
    matchResult,
    `Found ${matchResult.totalMatches} nearby recipient NGOs within ${radiusKm} km radius.`
  );
});

export const getNearbyDonationsForLocation = asyncHandler(async (req, res) => {
  const lat = req.query.lat ? parseFloat(req.query.lat) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng) : null;
  const radiusKm = req.query.radius ? parseFloat(req.query.radius) : 15;
  const { category } = req.query;

  if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
    throw ApiError.badRequest('Query parameters "lat" and "lng" are required and must be valid coordinates.');
  }

  const result = await matchingService.findNearbyDonationsForLocation(lat, lng, radiusKm, category);
  return ApiResponse.success(
    res,
    result,
    `Found ${result.totalFound} active food donations within ${radiusKm} km.`
  );
});

export const getAllRegisteredNGOs = asyncHandler(async (req, res) => {
  const ngos = matchingService.getAllNGOs();
  return ApiResponse.success(res, ngos, 'Registered recipient NGOs retrieved', 200, {
    count: ngos.length
  });
});

export const matchingController = {
  getNearbyNGOsForDonation,
  getNearbyDonationsForLocation,
  getAllRegisteredNGOs
};

export default matchingController;
