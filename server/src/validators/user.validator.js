import { z } from 'zod';
import { USER_ROLE } from '../config/constants.js';

/**
 * Shared Data Contract: User Profile
 * Fields: userId, name, email, role
 */
export const registerUserSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address format'),
  role: z.nativeEnum(USER_ROLE, {
    errorMap: () => ({ message: `Role must be one of: ${Object.values(USER_ROLE).join(', ')}` })
  }).default(USER_ROLE.RECEIVER)
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(USER_ROLE, {
    errorMap: () => ({ message: `Invalid role. Must be one of: ${Object.values(USER_ROLE).join(', ')}` })
  })
});

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
