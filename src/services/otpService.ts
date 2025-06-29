import twilio, { Twilio } from 'twilio';
import { OTP_CONFIG } from '../utils/constants';
import logger from '../utils/logger';

// In-memory OTP storage (in production, use Redis)
const otpStore = new Map<string, OTPData>();

interface OTPData {
  otp: string;
  expiryTime: number;
  attempts: number;
}

interface OTPStatus {
  exists: boolean;
  isExpired?: boolean;
  attempts?: number;
  remainingAttempts?: number;
  expiresIn?: number;
}

class OTPService {
  private client: Twilio | null = null;
  private phoneNumber: string | null = null;

  constructor() {
    this.initializeTwilio();
  }

  private initializeTwilio(): void {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && phoneNumber) {
      this.client = twilio(accountSid, authToken);
      this.phoneNumber = phoneNumber;
      logger.info('Twilio client initialized');
    } else {
      logger.warn('Twilio credentials not found, OTP service will use mock mode');
    }
  }

  // Generate OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP with expiry
  private storeOTP(mobileNumber: string, otp: string): void {
    const expiryTime = Date.now() + (OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);
    const attempts = 0;

    otpStore.set(mobileNumber, {
      otp,
      expiryTime,
      attempts,
    });

    // Clean up expired OTPs
    this.cleanupExpiredOTPs();
  }

  // Get stored OTP
  private getStoredOTP(mobileNumber: string): OTPData | undefined {
    return otpStore.get(mobileNumber);
  }

  // Remove stored OTP
  private removeOTP(mobileNumber: string): void {
    otpStore.delete(mobileNumber);
  }

  // Clean up expired OTPs
  private cleanupExpiredOTPs(): void {
    const now = Date.now();
    for (const [mobileNumber, data] of otpStore.entries()) {
      if (data.expiryTime < now) {
        otpStore.delete(mobileNumber);
      }
    }
  }

  // Send OTP via SMS
  private async sendOTPSMS(mobileNumber: string, otp: string): Promise<boolean> {
    if (!this.client || !this.phoneNumber) {
      logger.info(`Mock SMS sent to ${mobileNumber}: Your OTP is ${otp}`);
      return true;
    }

    try {
      const message = await this.client.messages.create({
        body: `Your Restaurant Management OTP is: ${otp}. Valid for ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`,
        from: this.phoneNumber,
        to: mobileNumber,
      });

      logger.info(`SMS sent successfully to ${mobileNumber}, SID: ${message.sid}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send SMS to ${mobileNumber}:`, error);
      throw new Error('Failed to send OTP SMS');
    }
  }

  // Generate and send OTP
  async generateAndSendOTP(mobileNumber: string): Promise<string> {
    // Check if OTP already exists and is not expired
    const existingOTP = this.getStoredOTP(mobileNumber);
    if (existingOTP && existingOTP.expiryTime > Date.now()) {
      const remainingTime = Math.ceil((existingOTP.expiryTime - Date.now()) / 1000 / 60);
      throw new Error(`OTP already sent. Please wait ${remainingTime} minutes before requesting another OTP.`);
    }

    // Generate new OTP
    const otp = this.generateOTP();

    // Store OTP
    this.storeOTP(mobileNumber, otp);

    // Send OTP via SMS
    await this.sendOTPSMS(mobileNumber, otp);

    return otp;
  }

  // Verify OTP
  async verifyOTP(mobileNumber: string, otp: string): Promise<boolean> {
    const storedData = this.getStoredOTP(mobileNumber);

    if (!storedData) {
      throw new Error('No OTP found for this mobile number');
    }

    // Check if OTP is expired
    if (storedData.expiryTime < Date.now()) {
      this.removeOTP(mobileNumber);
      throw new Error('OTP has expired');
    }

    // Check if max attempts exceeded
    if (storedData.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      this.removeOTP(mobileNumber);
      throw new Error('Maximum OTP verification attempts exceeded');
    }

    // Increment attempts
    storedData.attempts++;

    // Verify OTP
    if (storedData.otp === otp) {
      // Remove OTP on successful verification
      this.removeOTP(mobileNumber);
      return true;
    } else {
      // Update attempts in store
      otpStore.set(mobileNumber, storedData);
      return false;
    }
  }

  // Resend OTP
  async resendOTP(mobileNumber: string): Promise<string> {
    // Remove existing OTP if any
    this.removeOTP(mobileNumber);

    // Generate and send new OTP
    return await this.generateAndSendOTP(mobileNumber);
  }

  // Get OTP status (for debugging)
  getOTPStatus(mobileNumber: string): OTPStatus {
    const storedData = this.getStoredOTP(mobileNumber);
    if (!storedData) {
      return { exists: false };
    }

    return {
      exists: true,
      isExpired: storedData.expiryTime < Date.now(),
      attempts: storedData.attempts,
      remainingAttempts: OTP_CONFIG.MAX_ATTEMPTS - storedData.attempts,
      expiresIn: Math.ceil((storedData.expiryTime - Date.now()) / 1000 / 60),
    };
  }

  // Clear all OTPs (for testing)
  clearAllOTPs(): void {
    otpStore.clear();
    logger.info('All OTPs cleared');
  }
}

export default new OTPService(); 