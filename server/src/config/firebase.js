/**
 * ==============================================================================
 * SHAREBITE - FIREBASE & DATABASE CONFIGURATION
 * ==============================================================================
 *
 * Implements:
 * 1. Cloud Firebase Admin SDK connection when credentials / service account are supplied.
 * 2. High-performance Persistent Local Firestore Adapter when running in local dev / offline mode.
 * 3. Unified Firestore collection interface (users, food_donations, food_requests, audit_logs)
 * 4. Authentication service integration (token verification, user identity resolution)
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { env } from './environment.js';
import { FOOD_CATEGORY, FOOD_STATUS, REQUEST_STATUS, USER_ROLE } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistence path for local Firestore engine
const DATA_DIR = path.resolve(__dirname, '../../data');
const LOCAL_DB_PATH = path.resolve(DATA_DIR, 'firestore_db.json');

// Initial seed dataset matching Shared Data Contracts
const INITIAL_SEED_DATA = {
  users: {
    'usr_001': {
      userId: 'usr_001',
      name: 'Downtown Community Kitchen',
      email: 'kitchen@downtown.org',
      role: USER_ROLE.DONOR,
      phone: '+1-555-019-2831',
      address: '100 University Ave, Community Kitchen, Metro City',
      isVerified: true,
      createdAt: '2026-11-01T08:00:00.000Z',
      updatedAt: '2026-11-01T08:00:00.000Z'
    },
    'usr_002': {
      userId: 'usr_002',
      name: 'Hope Community Shelter',
      email: 'info@hopeshelter.org',
      role: USER_ROLE.RECEIVER,
      phone: '+1-555-024-8899',
      address: '25 Hope Way, Shelter Complex, Metro City',
      isVerified: true,
      createdAt: '2026-11-02T10:30:00.000Z',
      updatedAt: '2026-11-02T10:30:00.000Z'
    },
    'usr_admin': {
      userId: 'usr_admin',
      name: 'System Admin',
      email: 'admin@sharebite.org',
      role: USER_ROLE.ADMIN,
      phone: '+1-555-099-0001',
      address: 'ShareBite HQ, Tech Park, Metro City',
      isVerified: true,
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z'
    }
  },
  food_donations: {
    'food_001': {
      foodId: 'food_001',
      foodName: 'Fresh Vegetable Curry & Rice',
      quantity: 25,
      category: FOOD_CATEGORY.COOKED_MEALS,
      donorId: 'usr_001',
      donorName: 'Downtown Community Kitchen',
      location: {
        address: '100 University Ave, Community Kitchen',
        city: 'Metro City',
        latitude: 12.9716,
        longitude: 77.5946
      },
      preparedTime: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      pickupDeadline: new Date(Date.now() + 3600 * 1000 * 8).toISOString(),
      status: FOOD_STATUS.AVAILABLE,
      allergens: ['Dairy'],
      storageInstructions: 'Keep in warm insulated container or refrigerate under 4°C',
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    },
    'food_002': {
      foodId: 'food_002',
      foodName: 'Artisan Sourdough Loaves & Croissants',
      quantity: 15,
      category: FOOD_CATEGORY.BAKERY,
      donorId: 'usr_001',
      donorName: 'Downtown Community Kitchen',
      location: {
        address: '42 Baker Street',
        city: 'Metro City',
        latitude: 12.9789,
        longitude: 77.6012
      },
      preparedTime: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      pickupDeadline: new Date(Date.now() + 3600 * 1000 * 12).toISOString(),
      status: FOOD_STATUS.AVAILABLE,
      allergens: ['Wheat', 'Gluten'],
      storageInstructions: 'Store in dry ambient room temperature',
      createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
    }
  },
  food_requests: {
    'req_001': {
      requestId: 'req_001',
      foodId: 'food_001',
      foodName: 'Fresh Vegetable Curry & Rice',
      receiverId: 'usr_002',
      receiverName: 'Hope Community Shelter',
      requestedQuantity: 5,
      requestStatus: REQUEST_STATUS.PENDING,
      notes: 'Evening dinner service for 5 resident families',
      createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1800 * 1000).toISOString()
    }
  },
  audit_logs: {
    'log_001': {
      logId: 'log_001',
      action: 'SYSTEM_INITIALIZED',
      performedBy: 'usr_admin',
      targetEntityId: 'system',
      metadata: { initializedBy: 'System', module: 'Database & Storage Engine' },
      timestamp: new Date().toISOString()
    }
  }
};

/**
 * High-Performance Local Persistent Firestore Engine
 * Saves every update to disk and exposes standard Firestore Document & Query APIs.
 */
class LocalFirestoreAdapter {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {};
    this.ensureDirectoryAndLoad();
  }

  ensureDirectoryAndLoad() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        // Seed default dataset
        this.data = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
        this.save();
      }
    } catch (err) {
      console.error('[LocalFirestore] Warning during load, initializing fresh state:', err.message);
      this.data = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[LocalFirestore] Error persisting to disk:', err.message);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = {};
      this.save();
    }
    return this.data[name];
  }

  collection(name) {
    const self = this;

    return {
      name,

      doc(docId) {
        const col = self.getCollection(name);

        return {
          id: docId,
          ref: { id: docId, collection: name },

          async get() {
            const rawDoc = col[docId];
            const exists = Boolean(rawDoc);
            return {
              id: docId,
              exists,
              data: () => (exists ? JSON.parse(JSON.stringify(rawDoc)) : null)
            };
          },

          async set(data, options = {}) {
            const existing = col[docId] || {};
            const merged = options.merge ? { ...existing, ...data } : { ...data };
            col[docId] = merged;
            self.save();
            return { id: docId };
          },

          async update(updateData) {
            const existing = col[docId];
            if (!existing) {
              throw new Error(`Document with ID '${docId}' not found in collection '${name}'`);
            }
            col[docId] = { ...existing, ...updateData };
            self.save();
            return { id: docId };
          },

          async delete() {
            if (col[docId]) {
              delete col[docId];
              self.save();
            }
            return { id: docId };
          }
        };
      },

      async add(data) {
        const id = `${name.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const docRef = this.doc(id);
        await docRef.set({ ...data, id });
        return { id, get: () => docRef.get() };
      },

      where(field, op, value) {
        return this._createQuery().where(field, op, value);
      },

      orderBy(field, direction = 'asc') {
        return this._createQuery().orderBy(field, direction);
      },

      limit(count) {
        return this._createQuery().limit(count);
      },

      async get() {
        return this._createQuery().get();
      },

      _createQuery() {
        return new LocalFirestoreQuery(self, name);
      }
    };
  }

  batch() {
    const operations = [];
    const self = this;

    return {
      set(docRef, data, options = {}) {
        operations.push(() => docRef.set(data, options));
        return this;
      },
      update(docRef, data) {
        operations.push(() => docRef.update(data));
        return this;
      },
      delete(docRef) {
        operations.push(() => docRef.delete());
        return this;
      },
      async commit() {
        for (const op of operations) {
          await op();
        }
        self.save();
        return true;
      }
    };
  }

  async runTransaction(updateFunction) {
    const self = this;
    const transaction = {
      async get(docRef) {
        return docRef.get();
      },
      set(docRef, data, options) {
        return docRef.set(data, options);
      },
      update(docRef, data) {
        return docRef.update(data);
      },
      delete(docRef) {
        return docRef.delete();
      }
    };
    const result = await updateFunction(transaction);
    self.save();
    return result;
  }

  getStats() {
    const counts = {};
    for (const [colName, colData] of Object.entries(this.data)) {
      counts[colName] = Object.keys(colData).length;
    }
    return {
      dbType: 'LOCAL_PERSISTENT_FIRESTORE',
      filePath: this.filePath,
      collections: counts,
      totalDocuments: Object.values(counts).reduce((a, b) => a + b, 0)
    };
  }
}

/**
 * Query Builder for LocalFirestore
 */
class LocalFirestoreQuery {
  constructor(adapter, collectionName) {
    this.adapter = adapter;
    this.collectionName = collectionName;
    this.filters = [];
    this.sortFields = [];
    this.limitCount = null;
  }

  where(field, op, value) {
    this.filters.push({ field, op, value });
    return this;
  }

  orderBy(field, direction = 'asc') {
    this.sortFields.push({ field, direction });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  async get() {
    const col = this.adapter.getCollection(this.collectionName);
    let docs = Object.values(col);

    // Apply filters
    for (const { field, op, value } of this.filters) {
      docs = docs.filter((doc) => {
        const val = this._getFieldValue(doc, field);
        switch (op) {
          case '==':
            return val === value;
          case '!=':
            return val !== value;
          case '>':
            return val > value;
          case '>=':
            return val >= value;
          case '<':
            return val < value;
          case '<=':
            return val <= value;
          case 'array-contains':
            return Array.isArray(val) && val.includes(value);
          case 'in':
            return Array.isArray(value) && value.includes(val);
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (this.sortFields.length > 0) {
      docs.sort((a, b) => {
        for (const { field, direction } of this.sortFields) {
          const valA = this._getFieldValue(a, field);
          const valB = this._getFieldValue(b, field);
          if (valA < valB) return direction === 'asc' ? -1 : 1;
          if (valA > valB) return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply limit
    if (typeof this.limitCount === 'number' && this.limitCount >= 0) {
      docs = docs.slice(0, this.limitCount);
    }

    // Wrap in standard Firestore DocumentSnapshot format
    const docSnapshots = docs.map((item) => {
      const id = item.foodId || item.requestId || item.userId || item.logId || item.id;
      return {
        id,
        exists: true,
        data: () => JSON.parse(JSON.stringify(item))
      };
    });

    return {
      docs: docSnapshots,
      empty: docSnapshots.length === 0,
      size: docSnapshots.length
    };
  }

  _getFieldValue(obj, fieldPath) {
    const parts = fieldPath.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr == null) return undefined;
      curr = curr[part];
    }
    return curr;
  }
}

// ==============================================================================
// INITIALIZATION: Detect Firebase Cloud credentials OR fallback to Local Engine
// ==============================================================================
let adminInstance = null;
let firestoreDb = null;
let firebaseAuth = null;
let isConfigured = false;
let dbEngineType = 'LOCAL_PERSISTENT_FIRESTORE';

const serviceAccountPath = env.FIREBASE?.SERVICE_ACCOUNT_PATH
  ? path.resolve(__dirname, '../../', env.FIREBASE.SERVICE_ACCOUNT_PATH)
  : path.resolve(__dirname, 'serviceAccountKey.json');

const hasServiceAccountFile = fs.existsSync(serviceAccountPath);
const hasEnvCredentials = Boolean(
  env.FIREBASE?.PROJECT_ID &&
  env.FIREBASE?.CLIENT_EMAIL &&
  env.FIREBASE?.PRIVATE_KEY &&
  !env.FIREBASE.PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----\nMIIEvgIBADAN')
);

if (hasServiceAccountFile || hasEnvCredentials) {
  try {
    let credential;
    if (hasServiceAccountFile) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      credential = admin.credential.cert(serviceAccount);
      console.log(`[Firebase] Initializing Firebase Admin with serviceAccountKey from ${serviceAccountPath}`);
    } else {
      credential = admin.credential.cert({
        projectId: env.FIREBASE.PROJECT_ID,
        clientEmail: env.FIREBASE.CLIENT_EMAIL,
        privateKey: env.FIREBASE.PRIVATE_KEY
      });
      console.log('[Firebase] Initializing Firebase Admin with environment credentials');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential,
        databaseURL: env.FIREBASE.DATABASE_URL || undefined
      });
    }

    adminInstance = admin;
    firestoreDb = admin.firestore();
    firebaseAuth = admin.auth();
    isConfigured = true;
    dbEngineType = 'FIREBASE_CLOUD';
    console.log('[Firebase] Successfully connected to Firebase Cloud Firestore and Auth!');
  } catch (error) {
    console.warn(`[Firebase] Admin initialization error: ${error.message}. Activating Local Persistent Engine.`);
  }
}

// Fallback to local persistent engine if Cloud Firebase is not configured
const localAdapter = new LocalFirestoreAdapter(LOCAL_DB_PATH);

if (!firestoreDb) {
  firestoreDb = localAdapter;
  console.log(`[Database] Running with Local Persistent Firestore Engine (${LOCAL_DB_PATH})`);
}

/**
 * Universal Auth Adapter
 * Works seamlessly whether Firebase Cloud or Local persistent storage is active
 */
export const auth = firebaseAuth || {
  verifyIdToken: async (token) => {
    // If token matches registered user id or demo prefix
    const users = localAdapter.getCollection('users');
    let matchedUser = Object.values(users).find((u) => u.userId === token || `Bearer ${u.userId}` === token);

    if (!matchedUser) {
      // Default to dev admin user
      matchedUser = users['usr_admin'] || {
        userId: 'usr_admin',
        email: 'admin@sharebite.org',
        role: USER_ROLE.ADMIN,
        name: 'System Admin'
      };
    }

    return {
      uid: matchedUser.userId,
      email: matchedUser.email,
      role: matchedUser.role,
      name: matchedUser.name
    };
  },

  getUser: async (uid) => {
    const userDoc = await localAdapter.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data();
    }
    return {
      uid,
      email: `${uid}@sharebite.local`,
      displayName: uid
    };
  },

  createUser: async (userRecord) => {
    const uid = userRecord.uid || `usr_${Date.now()}`;
    await localAdapter.collection('users').doc(uid).set({
      userId: uid,
      email: userRecord.email,
      name: userRecord.displayName || 'ShareBite User',
      role: userRecord.role || USER_ROLE.RECEIVER,
      createdAt: new Date().toISOString()
    });
    return { uid, email: userRecord.email };
  }
};

export const db = firestoreDb;
export const adminApp = adminInstance;
export const isFirebaseConfigured = isConfigured;
export const dbType = dbEngineType;

export const getDbStatus = () => {
  if (isFirebaseConfigured) {
    return {
      dbType: 'FIREBASE_CLOUD',
      isCloud: true,
      status: 'Connected to Google Cloud Firestore',
      projectId: env.FIREBASE.PROJECT_ID || 'Configured in Firebase Admin'
    };
  }
  return {
    ...localAdapter.getStats(),
    isCloud: false,
    status: 'Operational (Local Persistent Firestore Storage)'
  };
};

export default {
  admin: adminInstance,
  db,
  auth,
  isFirebaseConfigured,
  dbType,
  getDbStatus
};
