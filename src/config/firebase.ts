import * as admin from 'firebase-admin';
import logger from '../utils/logger';

interface FirebaseServiceAccount {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

interface UserData {
  email: string;
  phoneNumber?: string;
  password?: string;
  firstName: string;
  lastName: string;
}

interface UpdateUserData {
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  disabled?: boolean;
}

let firebaseApp: admin.app.App | null = null;

const initializeFirebase = (): admin.app.App | null => {
  try {
    // Check if Firebase is already initialized
    if (firebaseApp) {
      return firebaseApp;
    }

    // Get Firebase service account from environment variables
    const serviceAccount: FirebaseServiceAccount = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    // Check if we have the required environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      logger.warn('Firebase credentials not found, Firebase Authentication will be disabled');
      return null;
    }

    // Initialize Firebase Admin SDK
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    logger.info('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
};

const getFirebaseApp = (): admin.app.App | null => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

const getAuth = (): admin.auth.Auth | null => {
  const app = getFirebaseApp();
  return app ? app.auth() : null;
};

// Verify Firebase ID token
const verifyIdToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('Firebase ID token verification failed:', error);
    throw new Error('Invalid Firebase ID token');
  }
};

// Create custom token for mobile authentication
const createCustomToken = async (uid: string, additionalClaims: Record<string, any> = {}): Promise<string> => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    logger.error('Failed to create custom token:', error);
    throw new Error('Failed to create custom token');
  }
};

// Get user by UID
const getUserByUid = async (uid: string): Promise<admin.auth.UserRecord> => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    logger.error('Failed to get user by UID:', error);
    throw new Error('User not found');
  }
};

// Create user in Firebase Auth
const createUser = async (userData: UserData): Promise<admin.auth.UserRecord> => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    const userRecord = await auth.createUser({
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: userData.password,
      displayName: `${userData.firstName} ${userData.lastName}`,
      disabled: false,
    });

    return userRecord;
  } catch (error) {
    logger.error('Failed to create user in Firebase:', error);
    throw new Error('Failed to create user in Firebase');
  }
};

// Update user in Firebase Auth
const updateUser = async (uid: string, userData: UpdateUserData): Promise<admin.auth.UserRecord> => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    const updateData: admin.auth.UpdateRequest = {};
    if (userData.email) updateData.email = userData.email;
    if (userData.phoneNumber) updateData.phoneNumber = userData.phoneNumber;
    if (userData.displayName) updateData.displayName = userData.displayName;
    if (userData.disabled !== undefined) updateData.disabled = userData.disabled;

    const userRecord = await auth.updateUser(uid, updateData);
    return userRecord;
  } catch (error) {
    logger.error('Failed to update user in Firebase:', error);
    throw new Error('Failed to update user in Firebase');
  }
};

// Delete user from Firebase Auth
const deleteUser = async (uid: string): Promise<boolean> => {
  try {
    const auth = getAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    await auth.deleteUser(uid);
    return true;
  } catch (error) {
    logger.error('Failed to delete user from Firebase:', error);
    throw new Error('Failed to delete user from Firebase');
  }
};

export {
  initializeFirebase,
  getFirebaseApp,
  getAuth,
  verifyIdToken,
  createCustomToken,
  getUserByUid,
  createUser,
  updateUser,
  deleteUser,
}; 