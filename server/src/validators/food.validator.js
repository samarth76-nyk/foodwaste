import { z } from 'zod';
import { FOOD_CATEGORY, FOOD_STATUS, COMMON_ALLERGENS } from '../config/constants.js';

/**
 * Shared Data Contract: Location Schema
 */
export const locationSchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters'),
  city: z.string().min(2, 'City is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

/**
 * Shared Data Contract: Food Donation
 * Fields: foodId, foodName, quantity, category, donorId, location, preparedTime, pickupDeadline, status, allergens
 */
export const createFoodSchema = z.object({
  foodName: z.string().min(2, 'Food name must be at least 2 characters').max(100),
  quantity: z.union([
    z.number().positive('Quantity must be a positive number'),
    z.string().min(1, 'Quantity description is required')
  ]),
  category: z.nativeEnum(FOOD_CATEGORY, {
    errorMap: () => ({ message: `Invalid category. Must be one of: ${Object.values(FOOD_CATEGORY).join(', ')}` })
  }),
  donorId: z.string().min(1, 'Donor ID is required'),
  location: locationSchema,
  preparedTime: z.string().datetime({ message: 'Prepared time must be a valid ISO-8601 date string' }),
  pickupDeadline: z.string().datetime({ message: 'Pickup deadline must be a valid ISO-8601 date string' }),
  status: z.nativeEnum(FOOD_STATUS).default(FOOD_STATUS.AVAILABLE),
  allergens: z.array(z.string()).default(['None'])
});

export const updateFoodSchema = createFoodSchema.partial();

export const updateFoodStatusSchema = z.object({
  status: z.nativeEnum(FOOD_STATUS, {
    errorMap: () => ({ message: `Status must be one of: ${Object.values(FOOD_STATUS).join(', ')}` })
  })
});
