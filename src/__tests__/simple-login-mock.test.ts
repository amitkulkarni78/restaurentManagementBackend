import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import authController from '../controllers/authController';
import { loginSchema, validate } from '../validations/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

// Mock Firebase OTP service
jest.mock('../services/firebaseOTPService', () => ({
  isFirebaseEnabled: jest.fn().mockReturnValue(false),
  createUser: jest.fn().mockResolvedValue({ uid: 'mock-firebase-uid' }),
  sendOTP: jest.fn().mockResolvedValue({ success: true }),
  verifyOTP: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock JWT config
jest.mock('../config/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyToken: jest.fn().mockReturnValue({ userId: 'mock-user-id', email: 'test@example.com', role: 'user' }),
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock user data
const mockUsers = [
  {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    mobileNumber: '1234567890',
    password: 'hashed-password-1',
    role: 'user',
    isActive: true,
    isEmailVerified: true,
    isMobileVerified: true,
    loginAttempts: 0,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    mobileNumber: '9876543210',
    password: 'hashed-password-2',
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    isMobileVerified: true,
    loginAttempts: 0,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    mobileNumber: '5555555555',
    password: 'hashed-password-3',
    role: 'user',
    isActive: false, // Deactivated user
    isEmailVerified: true,
    isMobileVerified: true,
    loginAttempts: 0,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-4',
    firstName: 'Alice',
    lastName: 'Brown',
    email: 'alice.brown@example.com',
    mobileNumber: '1111111111',
    password: 'hashed-password-4',
    role: 'user',
    isActive: true,
    isEmailVerified: true,
    isMobileVerified: true,
    loginAttempts: 5, // Locked user
    isLocked: true,
    lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];



describe('Login API Tests (Pure Mock)', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Mock database config after mockUsers is defined
    jest.doMock('../config/db', () => ({
      getDataSource: jest.fn().mockReturnValue({
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([...mockUsers]),
          findOne: jest.fn().mockImplementation((options: any) => {
            if (options?.where?.id) {
              return Promise.resolve(mockUsers.find(user => user.id === options.where.id) || null);
            }
            if (options?.where?.email) {
              return Promise.resolve(mockUsers.find(user => user.email === options.where.email) || null);
            }
            if (options?.where?.mobileNumber) {
              return Promise.resolve(mockUsers.find(user => user.mobileNumber === options.where.mobileNumber) || null);
            }
            return Promise.resolve(mockUsers[0] || null);
          }),
          create: jest.fn().mockImplementation((entity: any) => ({
            ...entity,
            id: `mock-id-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          delete: jest.fn().mockResolvedValue({ affected: 1 }),
          clear: jest.fn().mockResolvedValue(undefined),
          count: jest.fn().mockResolvedValue(mockUsers.length),
        }),
        initialize: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn().mockResolvedValue(undefined),
      }),
    }));

    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Setup login route
    app.post('/login', validate(loginSchema), asyncHandler(authController.login));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /login - Input Validation', () => {
    it('should return 400 when emailOrMobile is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          password: 'TestPass123!'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'emailOrMobile',
              message: 'Email or mobile number is required'
            })
          ])
        }
      });
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password is required'
            })
          ])
        }
      });
    });

    it('should return 400 when both fields are missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toHaveLength(2);
    });

    it('should return 400 when emailOrMobile is empty string', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: '',
          password: 'TestPass123!'
        })
        .expect(400);

      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'emailOrMobile',
          message: 'Email or mobile number is required'
        })
      );
    });

    it('should return 400 when password is empty string', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'test@example.com',
          password: ''
        })
        .expect(400);

      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: 'Password is required'
        })
      );
    });
  });

  describe('POST /login - Mock Response Validation', () => {
    it('should return proper mock response structure for valid user', async () => {
      // Mock bcrypt to return true for password comparison
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'john.doe@example.com',
          password: 'TestPass123!'
        })
        .expect(200);

      // Verify success response structure
      expect(response.body).toMatchObject({
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        data: {
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            mobileNumber: '1234567890',
            role: 'user',
            isActive: true,
            isEmailVerified: true,
            isMobileVerified: true,
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        }
      });

      // Verify password is not included in response
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('loginAttempts');
      expect(response.body.data.user).not.toHaveProperty('isLocked');
    });

    it('should return 401 for invalid credentials', async () => {
      // Mock bcrypt to return false for password comparison
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'john.doe@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    });

    it('should return 403 for deactivated account', async () => {
      // Mock bcrypt to return true for password comparison
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'bob.johnson@example.com',
          password: 'TestPass123!'
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Account is deactivated'
      });
    });

    it('should return 403 for locked account', async () => {
      // Mock bcrypt to return true for password comparison
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'alice.brown@example.com',
          password: 'TestPass123!'
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'nonexistent@example.com',
          password: 'TestPass123!'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    });
  });

  describe('POST /login - Mock JWT Tokens', () => {
    it('should return mock JWT tokens on successful login', async () => {
      // Mock bcrypt to return true for password comparison
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'john.doe@example.com',
          password: 'TestPass123!'
        })
        .expect(200);

      // Verify mock tokens are returned
      expect(response.body.data.token).toBe('mock-jwt-token');
      expect(response.body.data.refreshToken).toBe('mock-refresh-token');
    });
  });

  describe('POST /login - Database Error Handling', () => {
    it('should return 500 when database is not connected', async () => {
      // Mock database connection failure
      const { getDataSource } = require('../config/db');
      getDataSource.mockReturnValue(null);

      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'test@example.com',
          password: 'TestPass123!'
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Database not connected'
      });
    });
  });
}); 