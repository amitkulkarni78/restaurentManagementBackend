import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { AppError } from '../middlewares/errorHandler';
import jwtConfig from '../config/jwt';
import firebaseOTPService from '../services/firebaseOTPService';
import db from '../config/db';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

class AuthController {
  
  // User signup
  async signup(req: Request, res: Response): Promise<void> {
    const { firstName, lastName, email, mobileNumber, password, role } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Check if user already exists
    let existingUser = await userRepository.findOne({
      where: { email }
    });

    if (!existingUser) {
      existingUser = await userRepository.findOne({
        where: { mobileNumber }
      });
    }

    if (existingUser) {
      if (existingUser['email'] === email) {
        throw new AppError(ERROR_MESSAGES.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
      } else {
        throw new AppError(ERROR_MESSAGES.MOBILE_EXISTS, HTTP_STATUS.CONFLICT);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = userRepository.create({
      firstName,
      lastName,
      email,
      mobileNumber,
      password: hashedPassword,
      role: role || 'user',
    });

    await userRepository.save(user);

    // Create user in Firebase Auth if enabled
    if (firebaseOTPService.isFirebaseEnabled()) {
      try {
        const firebaseUser = await firebaseOTPService.createUser({
          email,
          phoneNumber: mobileNumber,
          password,
          firstName,
          lastName,
        });
        (user as any).firebaseUid = firebaseUser.uid;
        await userRepository.save(user);
      } catch (error) {
        logger.error('Failed to create user in Firebase:', error);
        // Continue without Firebase user creation
      }
    }

    // Generate tokens
    const token = jwtConfig.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = jwtConfig.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Update user with refresh token
    (user as any).refreshToken = refreshToken;
    await userRepository.save(user);

    // Remove password from response
    const userResponse = { ...user };
    delete (userResponse as any).password;

    logger.info(`New user registered: ${user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_CREATED,
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    });
  }

  // User login
  async login(req: Request, res: Response): Promise<void> {
    const { emailOrMobile, password } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');
    try{
    // Find user by email or mobile
    let user = await userRepository.findOne({
      where: { email: emailOrMobile }
    });

    if (!user) {
      user = await userRepository.findOne({
        where: { mobileNumber: emailOrMobile }
      });
    }

    if (!user) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if account is locked
    if ((user as any).isLocked) {
      throw new AppError('Account is temporarily locked due to multiple failed login attempts', HTTP_STATUS.FORBIDDEN);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment login attempts
      (user as any).loginAttempts = ((user as any).loginAttempts || 0) + 1;
      if ((user as any).loginAttempts >= 5) {
        (user as any).isLocked = true;
        (user as any).lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      await userRepository.save(user);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Reset login attempts on successful login
    (user as any).loginAttempts = 0;
    (user as any).isLocked = false;
    (user as any).lockedUntil = null;

    // Generate tokens
    const token = jwtConfig.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = jwtConfig.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Update user with refresh token and last login
    (user as any).refreshToken = refreshToken;
    (user as any).lastLogin = new Date();
    await userRepository.update(user.id, {
      refreshToken,
      lastLogin: new Date(),
    });
    //await userRepository.save(user);

    // Remove password from response
    const userResponse = { ...user };
    delete (userResponse as any).password;

    logger.info(`User logged in: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Error logging in:', error);
    throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }
  }

  // Request Firebase OTP
  async requestOTP(req: Request, res: Response): Promise<void> {
    const { mobileNumber } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Check if user exists
    const user = await userRepository.findOne({ where: { mobileNumber } });
    if (!user) {
      throw new AppError('User not found with this mobile number', HTTP_STATUS.NOT_FOUND);
    }

    // Send OTP via Firebase
    const result = await firebaseOTPService.sendOTP(mobileNumber);

    logger.info(`Firebase OTP requested for mobile: ${mobileNumber}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.OTP_SENT,
      data: {
        mobileNumber,
        firebaseConfig: firebaseOTPService.getFirebaseConfig(),
        ...(result.otp && { otp: result.otp }), // Include OTP only in mock mode
      },
    });
  }

  // Verify OTP
  async verifyOTP(req: Request, res: Response): Promise<void> {
    const { mobileNumber, otp } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Check if user exists
    const user = await userRepository.findOne({ where: { mobileNumber } });
    if (!user) {
      throw new AppError('User not found with this mobile number', HTTP_STATUS.NOT_FOUND);
    }

    // Verify OTP via Firebase
    const result = await firebaseOTPService.verifyOTP(mobileNumber, otp);

    if (!result.isValid) {
      throw new AppError(ERROR_MESSAGES.INVALID_OTP, HTTP_STATUS.BAD_REQUEST);
    }

    // Mark mobile as verified
    user.isMobileVerified = true;
    await userRepository.save(user);

    logger.info(`Mobile verified for user: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.OTP_VERIFIED,
      data: {
        mobileNumber,
        isVerified: true,
      },
    });
  }

  // Refresh token
  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', HTTP_STATUS.BAD_REQUEST);
    }

    try {
      // Verify refresh token
      const decoded = jwtConfig.verifyRefreshToken(refreshToken);

      const dataSource = db.getDataSource();
      if (!dataSource) {
        throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      const userRepository = dataSource.getRepository('User');

      // Find user
      const user = await userRepository.findOne({ where: { id: decoded.userId } });
      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check if refresh token matches
      if ((user as any).refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
      }

      // Generate new tokens
      const newToken = jwtConfig.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = jwtConfig.generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      // Update user with new refresh token
      (user as any).refreshToken = newRefreshToken;
      await userRepository.save(user);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }
  }

  // Logout
  async logout(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Clear refresh token
    const user = await userRepository.findOne({ where: { id: req.user.id } });
    if (user) {
      (user as any).refreshToken = null;
      await userRepository.save(user);
    }

    logger.info(`User logged out: ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    });
  }

  // Get profile
  async getProfile(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const user = await userRepository.findOne({ where: { id: req.user.id } });
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Remove sensitive data
    const userResponse = { ...user };
    delete (userResponse as any).password;
    delete (userResponse as any).refreshToken;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: userResponse,
      },
    });
  }

  // Firebase Phone Authentication
  async firebasePhoneAuth(req: Request, res: Response): Promise<void> {
    const { mobileNumber, idToken } = req.body;

    if (!mobileNumber || !idToken) {
      throw new AppError('Mobile number and ID token are required', HTTP_STATUS.BAD_REQUEST);
    }

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Verify Firebase ID token
    const result = await firebaseOTPService.verifyOTP(mobileNumber, idToken);

    if (!result.verified) {
      throw new AppError('Invalid Firebase authentication', HTTP_STATUS.UNAUTHORIZED);
    }

    // Find or create user
    let user = await userRepository.findOne({ where: { mobileNumber } });

    if (!user) {
      // Create new user with Firebase UID
      user = userRepository.create({
        firstName: 'User',
        lastName: 'Firebase',
        email: `${mobileNumber}@firebase.local`,
        mobileNumber,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        role: 'user',
        isMobileVerified: true,
        firebaseUid: result.uid,
      });
      await userRepository.save(user);
    } else {
      // Update existing user with Firebase UID
      (user as any).firebaseUid = result.uid;
      user.isMobileVerified = true;
      await userRepository.save(user);
    }

    // Generate tokens
    const token = jwtConfig.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = jwtConfig.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Update user with refresh token
    (user as any).refreshToken = refreshToken;
    await userRepository.save(user);

    // Remove password from response
    const userResponse = { ...user };
    delete (userResponse as any).password;

    logger.info(`Firebase phone auth successful for: ${mobileNumber}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Firebase phone authentication successful',
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    });
  }

  // Get Firebase Configuration
  async getFirebaseConfig(req: Request, res: Response): Promise<void> {
    const config = firebaseOTPService.getFirebaseConfig();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Firebase configuration retrieved successfully',
      data: config,
    });
  }

  // OAuth Callback
  async oauthCallback(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Find or create user
    let user = await userRepository.findOne({ where: { email: req.user.email } });

    if (!user) {
      // Create new user from OAuth data
      user = userRepository.create({
        firstName: req.user.firstName || 'OAuth',
        lastName: req.user.lastName || 'User',
        email: req.user.email,
        mobileNumber: req.user.mobileNumber || '',
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        role: 'user',
        isEmailVerified: true,
      });
      await userRepository.save(user);
    }

    // Generate tokens
    const token = jwtConfig.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = jwtConfig.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Update user with refresh token
    (user as any).refreshToken = refreshToken;
    await userRepository.save(user);

    // Remove password from response
    const userResponse = { ...user };
    delete (userResponse as any).password;

    logger.info(`OAuth login successful for: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'OAuth login successful',
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    });
  }

  // Forgot Password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      throw new AppError('User not found with this email', HTTP_STATUS.NOT_FOUND);
    }

    // Generate password reset token
    const resetToken = jwtConfig.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store reset token in user record
    (user as any).passwordResetToken = resetToken;
    (user as any).passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await userRepository.save(user);

    // TODO: Send password reset email
    logger.info(`Password reset requested for: ${email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  }

  // Reset Password
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', HTTP_STATUS.BAD_REQUEST);
    }

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Find user with reset token
    const user = await userRepository.findOne({ 
      where: { 
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() } as any
      }
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST);
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    (user as any).passwordResetToken = null;
    (user as any).passwordResetExpires = null;
    await userRepository.save(user);

    logger.info(`Password reset successful for: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset successful',
    });
  }

  // Change Password
  async changePassword(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new AppError('New passwords do not match', HTTP_STATUS.BAD_REQUEST);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', HTTP_STATUS.BAD_REQUEST);
    }

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Find user
    const user = await userRepository.findOne({ where: { id: req.user.id } });
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if new password is same as current password
    const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
    if (isNewPasswordSame) {
      throw new AppError('New password must be different from current password', HTTP_STATUS.BAD_REQUEST);
    }

    // Update password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await userRepository.save(user);

    logger.info(`Password changed successfully for user: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully',
    });
  }
}

export default new AuthController(); 