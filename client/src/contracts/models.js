/**
 * ShareBite Shared Frontend Data Contracts & Enums
 * Mirrors backend models to ensure consistent data communication across the team.
 */

export const FOOD_STATUS = {
  AVAILABLE: 'AVAILABLE',
  REQUESTED: 'REQUESTED',
  CLAIMED: 'CLAIMED',
  COLLECTED: 'COLLECTED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

export const FOOD_CATEGORY = {
  COOKED_MEALS: 'Cooked Meals',
  PRODUCE: 'Produce',
  BAKERY: 'Bakery',
  DAIRY: 'Dairy',
  PACKAGED_GOODS: 'Packaged Goods',
  BEVERAGES: 'Beverages',
  OTHER: 'Other'
};

export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COLLECTED: 'COLLECTED',
  CANCELLED: 'CANCELLED'
};

export const USER_ROLE = {
  DONOR: 'DONOR',
  RECEIVER: 'RECEIVER',
  VOLUNTEER: 'VOLUNTEER',
  ADMIN: 'ADMIN'
};

/**
 * Factory for creating an empty or defaulted Food object
 */
export const createDefaultFood = () => ({
  foodId: '',
  foodName: '',
  quantity: '',
  category: FOOD_CATEGORY.COOKED_MEALS,
  donorId: '',
  location: {
    address: '',
    city: '',
    latitude: null,
    longitude: null
  },
  preparedTime: new Date().toISOString(),
  pickupDeadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
  status: FOOD_STATUS.AVAILABLE,
  allergens: ['None']
});

/**
 * Factory for creating an empty or defaulted Food Request object
 */
export const createDefaultRequest = () => ({
  requestId: '',
  foodId: '',
  receiverId: '',
  requestedQuantity: 1,
  requestStatus: REQUEST_STATUS.PENDING,
  createdAt: new Date().toISOString()
});

/**
 * Factory for User profile
 */
export const createDefaultUser = () => ({
  userId: '',
  name: '',
  email: '',
  role: USER_ROLE.RECEIVER
});
