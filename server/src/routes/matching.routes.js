import { Router } from 'express';
import { matchingController } from '../controllers/matching.controller.js';

const router = Router();

/**
 * ==============================================================================
 * NEARBY NGO MATCHING ROUTES
 * ==============================================================================
 */

/**
 * @route   GET /api/matching/donations/:foodId/ngos
 * @desc    Find nearby registered recipient NGOs within radius (km) of food donation
 * @access  Public
 */
router.get('/donations/:foodId/ngos', matchingController.getNearbyNGOsForDonation);

/**
 * @route   GET /api/matching/nearby-donations
 * @desc    Find active food listings within radius (km) of a given latitude/longitude
 * @access  Public
 */
router.get('/nearby-donations', matchingController.getNearbyDonationsForLocation);

/**
 * @route   GET /api/matching/ngos
 * @desc    List all registered recipient NGOs with locations and capacities
 * @access  Public
 */
router.get('/ngos', matchingController.getAllRegisteredNGOs);

export default router;
