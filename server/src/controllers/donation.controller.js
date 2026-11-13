import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { donationService } from '../services/donation.service.js';

/**
 * ==============================================================================
 * FOOD DONATIONS CONTROLLER (INTEGRATION PLACEHOLDERS)
 * ==============================================================================
 * Responsible Teammate: Teammate 3 (Food Donation, Requests & Admin Functionality)
 */

export const getAllDonations = asyncHandler(async (req, res) => {
  const { category, status, city } = req.query;
  const donations = await donationService.getAllDonations({ category, status, city });
  return ApiResponse.success(res, donations, 'Donations retrieved successfully', 200, {
    count: donations.length
  });
});

export const getDonationById = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const donation = await donationService.getDonationById(foodId);
  if (!donation) {
    throw ApiError.notFound(`Food donation with ID '${foodId}' was not found`);
  }
  return ApiResponse.success(res, donation, 'Donation details retrieved');
});

export const createDonation = asyncHandler(async (req, res) => {
  // Teammate 3 Integration Point: Validate and persist food donation
  const created = await donationService.createDonation(req.body);
  return ApiResponse.created(res, created, 'Food donation listing created successfully');
});

export const updateDonation = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const updated = await donationService.updateDonation(foodId, req.body);
  return ApiResponse.success(res, updated, 'Food donation updated successfully');
});

export const updateDonationStatus = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const { status } = req.body;
  const updated = await donationService.updateDonationStatus(foodId, status);
  return ApiResponse.success(res, updated, `Food donation status updated to ${status}`);
});

export const deleteDonation = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  await donationService.deleteDonation(foodId);
  return ApiResponse.success(res, { foodId }, 'Food donation removed/cancelled successfully');
});

export const donationController = {
  getAllDonations,
  getDonationById,
  createDonation,
  updateDonation,
  updateDonationStatus,
  deleteDonation
};

export default donationController;
