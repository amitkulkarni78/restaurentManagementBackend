import { getAuth, verifyIdToken, createCustomToken, getUserByUid, createUser, updateUser, deleteUser} from '../config/firebase';
//import { OTP_CONFIG } from '../utils/constants';
import logger from '../utils/logger';

interface IFirebaseOTPResult {
  isValid?: any;
  success: boolean;
  message?: string;
  otp?: string;
  verified?: boolean;
  uid?: string;
  user?: any;
  error?: string;
}

class FirebaseOTPService {
  private auth: any;
  private isEnabled: boolean;

  constructor() {
    this.auth = getAuth();
    this.isEnabled = !!this.auth;

    if (!this.isEnabled) {
      logger.warn('Firebase Auth not initialized, OTP service will use mock mode');
    }
  }

  // Generate OTP (for fallback/mock mode)
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via Firebase (handled by Firebase client SDK)
  async sendOTP(mobileNumber: string): Promise<IFirebaseOTPResult> {
    if (!this.isEnabled) {
      // Mock mode - simulate OTP sending
      const otp = this.generateOTP();
      logger.info(`Mock Firebase OTP sent to ${mobileNumber}: ${otp}`);
      return {
        success: true,
        message: 'OTP sent successfully (mock mode)',
        otp: otp, // Only in mock mode for testing
      };
    }
    // In real Firebase implementation, the client SDK handles OTP sending
    logger.info(`Firebase OTP request initiated for ${mobileNumber}`);
    return {
      success: true,
      message: 'OTP sent successfully via Firebase',
    };
  }

  // Verify OTP using Firebase ID token
  async verifyOTP(mobileNumber: string, idToken: string): Promise<IFirebaseOTPResult> {
    if (!this.isEnabled) {
      // Mock mode - accept any token for testing
      logger.info(`Mock Firebase OTP verification for ${mobileNumber}`);
      return {
        success: true,
        verified: true,
        uid: `mock_uid_${mobileNumber}`,
      };
    }
    try {
      // Verify the Firebase ID token
      const decodedToken = await verifyIdToken(idToken);
      // Check if the phone number matches
      if (decodedToken.phone_number !== mobileNumber) {
        throw new Error('Phone number mismatch');
      }
      logger.info(`Firebase OTP verified for ${mobileNumber}, UID: ${decodedToken.uid}`);
      return {
        success: true,
        verified: true,
        uid: decodedToken.uid,
        user: decodedToken,
      };
    } catch (error: any) {
      logger.error(`Firebase OTP verification failed for ${mobileNumber}:`, error);
      return {
        success: false,
        verified: false,
        error: error.message,
      };
    }
  }

  // Create custom token for mobile app authentication
  async createCustomToken(uid: string, additionalClaims: object = {}): Promise<string | null> {
    if (!this.isEnabled) {
      logger.warn('Firebase not enabled, cannot create custom token');
      return null;
    }
    try {
      const customToken = await createCustomToken(uid, additionalClaims);
      logger.info(`Custom token created for UID: ${uid}`);
      return customToken;
    } catch (error) {
      logger.error('Failed to create custom token:', error);
      throw new Error('Failed to create custom token');
    }
  }

  // Get user by UID
  async getUserByUid(uid: string): Promise<any> {
    if (!this.isEnabled) {
      logger.warn('Firebase not enabled, cannot get user by UID');
      return null;
    }
    try {
      const userRecord = await getUserByUid(uid);
      return userRecord;
    } catch (error) {
      logger.error('Failed to get user by UID:', error);
      throw new Error('User not found');
    }
  }

  // Create user in Firebase Auth
  async createUser(userData: any): Promise<any> {
    if (!this.isEnabled) {
      logger.warn('Firebase not enabled, cannot create user');
      return null;
    }
    try {
      const userRecord = await createUser(userData);
      logger.info(`User created in Firebase: ${userRecord.uid}`);
      return userRecord;
    } catch (error) {
      logger.error('Failed to create user in Firebase:', error);
      throw new Error('Failed to create user in Firebase');
    }
  }

  // Update user in Firebase Auth
  async updateUser(uid: string, userData: any): Promise<any> {
    if (!this.isEnabled) {
      logger.warn('Firebase not enabled, cannot update user');
      return null;
    }
    try {
      const userRecord = await updateUser(uid, userData);
      logger.info(`User updated in Firebase: ${uid}`);
      return userRecord;
    } catch (error) {
      logger.error('Failed to update user in Firebase:', error);
      throw new Error('Failed to update user in Firebase');
    }
  }

  // Delete user from Firebase Auth
  async deleteUser(uid: string): Promise<boolean> {
    if (!this.isEnabled) {
      logger.warn('Firebase not enabled, cannot delete user');
      return false;
    }
    try {
      await deleteUser(uid);
      logger.info(`User deleted from Firebase: ${uid}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete user from Firebase:', error);
      throw new Error('Failed to delete user from Firebase');
    }
  }

  // Check if Firebase is enabled
  isFirebaseEnabled(): boolean {
    return this.isEnabled;
  }

  // Get Firebase configuration for client
  getFirebaseConfig(): object {
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };
  }
}

export default new FirebaseOTPService(); 