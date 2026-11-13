# ShareBite – Developer & Subsystems Integration Guide

Welcome to the **ShareBite** engineering repository. This guide defines subsystem domains, directory boundaries, integration steps, and Git branching rules for modular development.

---

## 1. Subsystem Responsibilities & File Boundaries

| Subsystem | Responsibility Domain | Primary Directory Boundaries |
|---|---|---|
| **Core Architecture & Server** | Project Architecture, Integration & Server Config | `server/src/app.js`, `server/src/server.js`, `server/src/routes/index.js`, `docs/`, Root configs |
| **Frontend & UI** | Frontend and UI Components | `client/src/pages/`, `client/src/components/`, `client/src/App.jsx` |
| **Authentication & Database** | Firebase, Firestore & Authentication | `server/src/config/firebase.js`, `server/src/middleware/auth.middleware.js`, `server/src/services/auth.service.js` |
| **Donations, Requests & Admin** | Donations, Requests & Admin Business Logic | `server/src/services/donation.service.js`, `server/src/services/request.service.js`, `server/src/services/admin.service.js`, `server/src/services/stats.service.js` |

---

## 2. Frontend & UI Subsystem Guide

### 2.1 Subsystem Scope
Build the user-facing interface in React using Vite.

### 2.2 Files
- `client/src/pages/*` – All page routes (e.g. `HomePage.jsx`, `DonationsPage.jsx`, `RequestsPage.jsx`, `AdminPage.jsx`)
- `client/src/components/*` – Reusable UI widgets (cards, forms, modal dialogs, status badges)
- `client/src/App.jsx` – Wrap or mount your UI / React Router
- `client/src/index.css` – Application styling or Tailwind if added

### 2.3 How to Connect to Backend
1. **Never hardcode URLs.** Use the configured `apiClient` and `API_ENDPOINTS`:
   ```javascript
   import apiClient from '../api/apiClient';
   import API_ENDPOINTS from '../api/endpoints';

   // Fetch donations
   const response = await apiClient.get(API_ENDPOINTS.DONATIONS.LIST, {
     params: { category: 'Produce', status: 'AVAILABLE' }
   });
   const donations = response.data; // Already unwrapped!
   ```
2. **Standard Data Models:**
   Import model factories and enums from:
   ```javascript
   import { FOOD_STATUS, FOOD_CATEGORY, USER_ROLE } from '../contracts/models';
   ```
3. **Session Token Handling:**
   When logging in, store the auth token in `localStorage`:
   ```javascript
   localStorage.setItem('sharebite_token', token);
   ```
   The `apiClient` interceptor will automatically attach `Authorization: Bearer <token>` to all subsequent requests.

---

## 3. Firebase & Database Subsystem Guide

### 3.1 Subsystem Scope
Connect Google Firebase (Authentication & Firestore NoSQL) to both backend and frontend.

### 3.2 Key Files
- `server/src/config/firebase.js`
- `server/src/middleware/auth.middleware.js`
- `server/src/services/auth.service.js`
- Database schema verification in `docs/DATABASE_SCHEMA.md`

### 3.3 Setup Steps
1. In the `server` directory, install Firebase Admin SDK:
   ```bash
   cd server
   npm install firebase-admin
   ```
2. Go to the Firebase Console:
   - Create project `sharebite-app`.
   - Enable **Firestore Database** in test/production mode.
   - Enable **Authentication** (Email/Password and/or Google Auth).
   - Go to **Project Settings > Service Accounts**, click **Generate new private key**.
3. Save the downloaded JSON file as:
   `server/src/config/serviceAccountKey.json`
   *(Notice: `.gitignore` already protects `serviceAccountKey.json` from being committed).*
4. In `server/src/config/firebase.js`:
   Uncomment and initialize the Firebase Admin SDK:
   ```javascript
   import admin from 'firebase-admin';
   import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

   if (!admin.apps.length) {
     admin.initializeApp({
       credential: admin.credential.cert(serviceAccount)
     });
   }

   export const db = admin.firestore();
   export const auth = admin.auth();
   export const isFirebaseConfigured = true;
   ```
5. In `server/src/middleware/auth.middleware.js`:
   Replace the fallback token check with:
   ```javascript
   const decodedToken = await auth.verifyIdToken(token);
   req.user = {
     userId: decodedToken.uid,
     email: decodedToken.email,
     role: decodedToken.role || 'RECEIVER'
   };
   ```

---

## 4. Food Donations, Requests & Admin Subsystem Guide

### 4.1 Subsystem Scope
Implement the business logic, state transitions, matching, and Firestore queries for donations, requests, and administration.

### 4.2 Key Files
- `server/src/services/donation.service.js`
- `server/src/services/request.service.js`
- `server/src/services/admin.service.js`
- `server/src/services/stats.service.js`

### 4.3 Implementation Rules & Best Practices
1. **Firestore Client Access:**
   Import the shared `db` instance:
   ```javascript
   import { db } from '../config/firebase.js';
   ```
2. **Business Rules to Enforce:**
   - **Food Donation Expiration:** When listing food, ensure `pickupDeadline > preparedTime`.
   - **Request Lifecycle:** When a request is `APPROVED`:
     - Deduct the requested portion quantity from the food donation listing.
     - If quantity reaches `0`, update food status to `CLAIMED`.
   - **Access Control:** Only the `donorId` of a listing or an `ADMIN` can edit or delete a donation.
3. **Response & Error Handling:**
   Controllers already wrap your methods with `asyncHandler`. To throw an error, simply throw an `ApiError`:
   ```javascript
   import { ApiError } from '../utils/ApiError.js';

   if (!donation) {
     throw ApiError.notFound('Donation not found');
   }
   if (donation.quantity < requestedQuantity) {
     throw ApiError.badRequest('Requested quantity exceeds available portions');
   }
   ```

---

## 5. Git Branching & Conflict Avoidance Strategy

To maintain clean modular git branches across features:

```
main (Production Ready)
 └── integration (Staging & Architecture)
      ├── feature/frontend-ui           (Frontend UI branch)
      ├── feature/firebase-auth-db      (Database & Auth branch)
      └── feature/donations-requests    (Donations & Requests branch)
```

### 5.1 Branching Rules
1. Never commit directly to `main`.
2. Always branch off `integration`.
3. Before submitting a Pull Request, run:
   ```bash
   git fetch origin
   git rebase origin/integration
   ```
4. Keep feature boundaries decoupled to prevent conflicts.
5. All route registrations in `server/src/routes/` are already decoupled into individual route files, so editing one route file will **never** cause conflicts with another.

---

## 6. Testing & Verifying Your Work

Run the server and client concurrently from the root directory:
```bash
npm run dev
```

Or run them in separate terminals:
- Backend:
  ```bash
  cd server
  npm run dev
  ```
- Frontend:
  ```bash
  cd client
  npm run dev
  ```

Open `http://localhost:5173` to see the live Architecture & Integration Console.
