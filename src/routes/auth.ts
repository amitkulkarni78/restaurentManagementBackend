import express from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import {
  authenticateJWT,
  verifyRefreshToken,
  authRateLimit,
  otpRateLimit
} from '../middlewares/auth';
import {
  signupSchema,
  loginSchema,
  otpRequestSchema,
  otpVerificationSchema,
  refreshTokenSchema,
  validate
} from '../validations/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import authController from '../controllers/authController';

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit(authRateLimit);
const otpLimiter = rateLimit(otpRateLimit);

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - mobileNumber
 *               - password
 *               - confirmPassword
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               mobileNumber:
 *                 type: string
 *                 pattern: '^[0-9]{10,15}$'
 *               password:
 *                 type: string
 *                 minLength: 6
 *               confirmPassword:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, staff, user]
 *                 default: user
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(authController.signup));

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrMobile
 *               - password
 *             properties:
 *               emailOrMobile:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));

/**
 * @swagger
 * /api/v1/auth/otp/request:
 *   post:
 *     summary: Request OTP for mobile verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 pattern: '^[0-9]{10,15}$'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Validation error
 */
router.post('/otp/request', otpLimiter, validate(otpRequestSchema), asyncHandler(authController.requestOTP));

/**
 * @swagger
 * /api/v1/auth/otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *               - otp
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 pattern: '^[0-9]{10,15}$'
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 */
router.post('/otp/verify', validate(otpVerificationSchema), asyncHandler(authController.verifyOTP));

/**
 * @swagger
 * /api/v1/auth/firebase/request-otp:
 *   post:
 *     summary: Request Firebase OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 pattern: '^[0-9]{10,15}$'
 *     responses:
 *       200:
 *         description: Firebase OTP sent successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.post('/firebase/request-otp', otpLimiter, validate(otpRequestSchema), asyncHandler(authController.requestOTP));

/**
 * @swagger
 * /api/v1/auth/firebase/verify-otp:
 *   post:
 *     summary: Verify Firebase OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *               - idToken
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 pattern: '^[0-9]{10,15}$'
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Firebase OTP verified successfully
 *       400:
 *         description: Invalid OTP
 */
router.post('/firebase/verify-otp', validate(otpRequestSchema), asyncHandler(authController.verifyOTP));

/**
 * @swagger
 * /api/v1/auth/firebase/phone-auth:
 *   post:
 *     summary: Firebase phone authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *               - idToken
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 pattern: '^[0-9]{10,15}$'
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone authentication successful
 *       401:
 *         description: Invalid authentication
 */
router.post('/firebase/phone-auth', asyncHandler(authController.firebasePhoneAuth));

/**
 * @swagger
 * /api/v1/auth/firebase/config:
 *   get:
 *     summary: Get Firebase configuration for client
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Firebase configuration retrieved successfully
 */
router.get('/firebase/config', asyncHandler(authController.getFirebaseConfig));

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), verifyRefreshToken, asyncHandler(authController.refreshToken));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticateJWT, asyncHandler(authController.logout));

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateJWT, asyncHandler(authController.getProfile));

// OAuth routes
/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Google OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       401:
 *         description: OAuth authentication failed
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  asyncHandler(authController.oauthCallback)
);

/**
 * @swagger
 * /api/v1/auth/facebook:
 *   get:
 *     summary: Facebook OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Facebook OAuth
 */
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

/**
 * @swagger
 * /api/v1/auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       401:
 *         description: OAuth authentication failed
 */
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  asyncHandler(authController.oauthCallback)
);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', authLimiter, asyncHandler(authController.forgotPassword));

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or password
 */
router.post('/reset-password', authLimiter, asyncHandler(authController.resetPassword));

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', authenticateJWT, asyncHandler(authController.changePassword));

export default router; 