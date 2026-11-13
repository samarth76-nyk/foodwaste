# ShareBite – Firebase Firestore Database Schema

This document details the database architecture for implementation in Google Cloud Firestore.

---

## 1. Firestore Collections Overview

```
Firestore Root
├── users/                (User profiles, roles, and contacts)
├── food_donations/       (Food donation listings posted by donors)
├── food_requests/        (Requests submitted by receivers/shelters)
└── audit_logs/           (Administrative system audit trail)
```

---

## 2. Collection Schemas

### 2.1 Collection: `users`
- **Document ID:** Firebase Auth `uid` (`String`)
- **Description:** Stores registered user profiles and role assignments.

```typescript
interface UserDocument {
  userId: string;              // Matches Firebase Auth UID
  name: string;                // Full name or Organization name
  email: string;               // Registered email address
  role: 'DONOR' | 'RECEIVER' | 'VOLUNTEER' | 'ADMIN';
  phone?: string;              // Optional contact phone number
  address?: string;            // Primary address
  isVerified: boolean;         // Identity / NGO verification status
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

#### Sample Document:
```json
{
  "userId": "usr_k892jxnsd0",
  "name": "Downtown Community Kitchen",
  "email": "kitchen@downtown.org",
  "role": "DONOR",
  "phone": "+1-555-019-2831",
  "address": "120 Market St, Metro City",
  "isVerified": true,
  "createdAt": "2026-11-01T08:00:00.000Z",
  "updatedAt": "2026-11-01T08:00:00.000Z"
}
```

---

### 2.2 Collection: `food_donations`
- **Document ID:** Auto-generated document ID (`foodId`)
- **Description:** Active, claimed, and historical food listings.

```typescript
interface FoodDonationDocument {
  foodId: string;              // Document ID
  foodName: string;            // E.g. "Cooked Rice & Vegetable Stew"
  quantity: string | number;   // E.g. "30 portions" or 30
  category: 'Cooked Meals' | 'Produce' | 'Bakery' | 'Dairy' | 'Packaged Goods' | 'Beverages' | 'Other';
  donorId: string;             // References users.userId
  donorName?: string;          // Denormalized donor name for fast display
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  preparedTime: FirebaseFirestore.Timestamp;
  pickupDeadline: FirebaseFirestore.Timestamp;
  status: 'AVAILABLE' | 'CLAIMED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  allergens: string[];         // E.g. ['Dairy', 'Gluten']
  storageInstructions?: string;// E.g. "Keep refrigerated under 4°C"
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

---

### 2.3 Collection: `food_requests`
- **Document ID:** Auto-generated document ID (`requestId`)
- **Description:** Claim requests submitted by receivers/shelters.

```typescript
interface FoodRequestDocument {
  requestId: string;           // Document ID
  foodId: string;              // References food_donations.foodId
  receiverId: string;          // References users.userId
  receiverName?: string;       // Denormalized receiver name
  requestedQuantity: number;   // Number of units/portions
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COLLECTED' | 'CANCELLED';
  notes?: string;              // Special transport/pickup notes
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

---

### 2.4 Collection: `audit_logs`
- **Document ID:** Auto-generated document ID (`logId`)
- **Description:** Immutable administrative log for compliance and moderation.

```typescript
interface AuditLogDocument {
  logId: string;
  action: 'DONATION_CREATED' | 'DONATION_UPDATED' | 'REQUEST_SUBMITTED' | 'REQUEST_STATUS_CHANGED' | 'USER_ROLE_CHANGED';
  performedBy: string;         // users.userId
  targetEntityId: string;      // foodId, requestId, or userId
  metadata?: Record<string, any>;
  timestamp: FirebaseFirestore.Timestamp;
}
```

---

## 3. Required Firestore Composite Indexes

For efficient queries and filtering, configure the following composite indexes in the Firebase Console:

| Collection | Fields Indexed | Query Supported |
|---|---|---|
| `food_donations` | `status` (ASC), `pickupDeadline` (ASC) | Active donation listings expiring soon |
| `food_donations` | `category` (ASC), `status` (ASC), `createdAt` (DESC) | Filter listings by category |
| `food_requests` | `receiverId` (ASC), `createdAt` (DESC) | User's request history |
| `food_requests` | `foodId` (ASC), `requestStatus` (ASC) | Incoming requests for specific food |
| `audit_logs` | `action` (ASC), `timestamp` (DESC) | Action-based audit review |

---

## 4. Firestore Security Rules Blueprint

Use this baseline configuration in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    function isAdmin() {
      return isSignedIn() && request.auth.token.role == 'ADMIN';
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Food Donations Collection
    match /food_donations/{foodId} {
      allow read: if true; // Public listings
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (resource.data.donorId == request.auth.uid || isAdmin());
      allow delete: if isSignedIn() && (resource.data.donorId == request.auth.uid || isAdmin());
    }

    // Food Requests Collection
    match /food_requests/{requestId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isAdmin();
    }

    // Audit Logs
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow write: if isSignedIn();
    }
  }
}
```
