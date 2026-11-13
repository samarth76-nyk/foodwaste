import { z } from 'zod';
import { REQUEST_STATUS } from '../config/constants.js';

/**
 * Shared Data Contract: Food Request
 * Fields: requestId, foodId, receiverId, requestedQuantity, requestStatus, createdAt
 */
export const createRequestSchema = z.object({
  foodId: z.string().min(1, 'Food ID is required'),
  receiverId: z.string().min(1, 'Receiver ID is required'),
  requestedQuantity: z.number().positive('Requested quantity must be greater than 0'),
  requestStatus: z.nativeEnum(REQUEST_STATUS).default(REQUEST_STATUS.PENDING),
  notes: z.string().max(300).optional()
});

export const updateRequestStatusSchema = z.object({
  requestStatus: z.nativeEnum(REQUEST_STATUS, {
    errorMap: () => ({ message: `Invalid status. Must be one of: ${Object.values(REQUEST_STATUS).join(', ')}` })
  })
});
