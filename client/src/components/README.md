# Frontend Components Directory

This directory contains reusable UI components for the ShareBite frontend application.

## Recommended Components to Create:
- `Navbar.jsx` – Navigation bar with user role badges and links.
- `FoodCard.jsx` – Display card for food listings showing `foodName`, `quantity`, `category`, and `pickupDeadline`.
- `DonationForm.jsx` – Form for creating food donations (conforms to `createFoodSchema`).
- `RequestModal.jsx` – Modal dialog for submitting a food request.
- `StatusBadge.jsx` – Color-coded badge for `AVAILABLE`, `CLAIMED`, `COMPLETED`, `EXPIRED`.
- `Alert.jsx` – Notification feedback banners.

## Shared Data Contracts:
Import data schemas, enums, and factories from:
```javascript
import { FOOD_STATUS, FOOD_CATEGORY, USER_ROLE } from '../contracts/models.js';
```

## Making API Calls:
Use the pre-configured `apiClient`:
```javascript
import apiClient from '../api/apiClient.js';
import { API_ENDPOINTS } from '../api/endpoints.js';

const response = await apiClient.get(API_ENDPOINTS.DONATIONS.LIST);
console.log(response.data); // Clean data payload unwrapped from ApiResponse
```
