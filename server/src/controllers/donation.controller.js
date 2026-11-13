import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { donationService } from '../services/donation.service.js';

/**
 * ==============================================================================
 * FOOD DONATIONS CONTROLLER
 * ==============================================================================
 * Responsible Teammate: Teammate 3 / Shreya (Food Donation, Requests & Admin)
 * ==============================================================================
 */

export const getAllDonations = asyncHandler(async (req, res) => {
  const { category, status, city, donorId } = req.query;
  const donations = await donationService.getAllDonations({ category, status, city, donorId });
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
  // Validate and persist food donation
  const created = await donationService.createDonation(req.body);
  return ApiResponse.created(res, created, 'Food donation listing created successfully');
});

export const updateDonation = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const updated = await donationService.updateDonation(foodId, req.body, req.user);
  return ApiResponse.success(res, updated, 'Food donation updated successfully');
});

export const updateDonationStatus = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const { status } = req.body;
  const updated = await donationService.updateDonationStatus(foodId, status);
  return ApiResponse.success(res, updated, `Food donation status updated to ${updated.status}`);
});

export const deleteDonation = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  await donationService.deleteDonation(foodId, req.user);
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
