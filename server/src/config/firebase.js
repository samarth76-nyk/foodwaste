/**
 * ==============================================================================
 * SHAREBITE - FIREBASE & DATABASE CONFIGURATION STUB
 * ==============================================================================
 * RESPONSIBLE TEAMMATE: Teammate 2 (Firebase and Database)
 * 
 * INSTRUCTIONS FOR TEAMMATE 2:
 * 1. Install firebase-admin if not already installed:
 *      npm install firebase-admin
 * 
 * 2. Create your Firebase project at https://console.firebase.google.com
 *    - Enable Firestore Database (start in test or production mode with rules)
 *    - Enable Authentication (Email/Password, Google, etc.)
 * 
 * 3. Generate Service Account Key:
 *    - Project Settings > Service Accounts > "Generate new private key"
 *    - Save file as: server/src/config/serviceAccountKey.json
 *    - (Or copy project_id, client_email, and private_key into server/.env)
 * 
 * 4. Replace the mock placeholders below with real admin SDK initialization:
 *      import admin from 'firebase-admin';
 *      import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };
 *      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
 *      export const db = admin.firestore();
 *      export const auth = admin.auth();
 * ==============================================================================
 */

import { env } from './environment.js';

let adminInstance = null;
let firestoreDb = null;
let firebaseAuth = null;
let isConfigured = false;

// Attempt dynamic initialization if firebase-admin is installed and configured
try {
  // Check if credentials exist
  const hasCredentials =
    Boolean(env.FIREBASE.PROJECT_ID && env.FIREBASE.PRIVATE_KEY) ||
    Boolean(env.FIREBASE.SERVICE_ACCOUNT_PATH);

  if (hasCredentials) {
    // Teammate 2 will complete initialization here:
    console.log('[Firebase] Credentials detected. Teammate 2 should finalize Admin SDK connection.');
  } else {
    console.warn('[Firebase] Running in DEV/MOCK mode. Firebase credentials not yet supplied.');
    console.warn('[Firebase] Teammate 2: Check docs/INTEGRATION_GUIDE.md for setup instructions.');
  }
} catch (error) {
  console.error('[Firebase] Failed to initialize Firebase Admin SDK:', error.message);
}

/**
 * Placeholder / Mock Database Client
 * Ensures server starts smoothly before Teammate 2 configures Firebase credentials.
 */
export const db = firestoreDb || {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async (data) => ({ success: true, id }),
      update: async (data) => ({ success: true, id }),
      delete: async () => ({ success: true, id })
    }),
    add: async (data) => ({ id: `mock-${Date.now()}` }),
    get: async () => ({ empty: true, docs: [] }),
    where: function () { return this; },
    limit: function () { return this; },
    orderBy: function () { return this; }
  })
};

/**
 * Placeholder / Mock Auth Client
 */
export const auth = firebaseAuth || {
  verifyIdToken: async (token) => {
    // Development fallback token verification
    if (env.MOCK_AUTH_ENABLED) {
      return {
        uid: 'mock-user-123',
        email: 'mockuser@sharebite.org',
        role: 'DONOR'
      };
    }
    throw new Error('Firebase Admin Auth not initialized. Set credentials in server/.env');
  },
  getUser: async (uid) => ({
    uid,
    email: 'mockuser@sharebite.org',
    displayName: 'Mock ShareBite User'
  })
};

export const admin = adminInstance;
export const isFirebaseConfigured = isConfigured;

export default {
  admin,
  db,
  auth,
  isFirebaseConfigured
};
