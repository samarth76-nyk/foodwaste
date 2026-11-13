/**
 * ShareBite – Shared Business Constants and Enums
 * Used across Validators, Services, Controllers, and Frontend Contracts
 */

export const FOOD_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  CLAIMED: 'CLAIMED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
});

export const FOOD_CATEGORY = Object.freeze({
  COOKED_MEALS: 'Cooked Meals',
  PRODUCE: 'Produce',
  BAKERY: 'Bakery',
  DAIRY: 'Dairy',
  PACKAGED_GOODS: 'Packaged Goods',
  BEVERAGES: 'Beverages',
  OTHER: 'Other'
});

export const REQUEST_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COLLECTED: 'COLLECTED',
  CANCELLED: 'CANCELLED'
});

export const USER_ROLE = Object.freeze({
  DONOR: 'DONOR',
  RECEIVER: 'RECEIVER',
  VOLUNTEER: 'VOLUNTEER',
  ADMIN: 'ADMIN'
});

export const COMMON_ALLERGENS = Object.freeze([
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree Nuts',
  'Peanuts',
  'Wheat',
  'Soybeans',
  'Gluten',
  'None'
]);

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
});
