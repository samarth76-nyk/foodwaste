import { Router } from 'express';
import { donationController } from '../controllers/donation.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createFoodSchema,
  updateFoodSchema,
  updateFoodStatusSchema
} from '../validators/food.validator.js';

const router = Router();

/**
 * ==============================================================================
 * FOOD DONATIONS ROUTES
 * ==============================================================================
 */

/**
 * @route   GET /api/donations
 * @desc    Get all food donations (with optional filters: category, status, city, urgency)
 * @access  Public
 */
router.get('/', donationController.getAllDonations);

/**
 * @route   GET /api/donations/warnings/expiring-soon
 * @desc    Pickup deadline warnings - Get listings expiring within X hours
 * @access  Public
 */
router.get('/warnings/expiring-soon', donationController.getExpiringSoonDonations);

/**
 * @route   GET /api/donations/:foodId
 * @desc    Get specific food donation by foodId (enriched with deadlineAnalysis)
 * @access  Public
 */
router.get('/:foodId', donationController.getDonationById);

/**
 * @route   POST /api/donations
 * @desc    Create a new food donation listing
 * @access  Private (Donors / Volunteers)
 */
router.post(
  '/',
  authenticate,
  validate(createFoodSchema),
  donationController.createDonation
);

/**
 * @route   PUT /api/donations/:foodId
 * @desc    Update a food donation listing
 * @access  Private (Donation Owner / Admin)
 */
router.put(
  '/:foodId',
  authenticate,
  validate(updateFoodSchema),
  donationController.updateDonation
);

/**
 * @route   PATCH /api/donations/:foodId/status
 * @desc    Update status of food donation (e.g. AVAILABLE, CLAIMED, COMPLETED)
 * @access  Private
 */
router.patch(
  '/:foodId/status',
  authenticate,
  validate(updateFoodStatusSchema),
  donationController.updateDonationStatus
);

/**
 * @route   DELETE /api/donations/:foodId
 * @desc    Cancel or delete a food donation listing
 * @access  Private (Donation Owner / Admin)
 */
router.delete('/:foodId', authenticate, donationController.deleteDonation);

export default router;
