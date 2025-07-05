import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { setupTestDatabase, teardownTestDatabase, clearTestData, createMockDatabase, mockUserData } from './test-setup';
import authController from '../controllers/authController';
import { loginSchema, validate } from '../validations/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

describe('Login API Tests (Mongo-Mock)', () => {
  let app: express.Application;
  let dbMock: any;

  beforeAll(async () => {
    // Setup test database using mongo-mock
    await setupTestDatabase();
    dbMock = createMockDatabase();

    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Setup login route
    app.post('/login', validate(loginSchema), asyncHandler(authController.login));

    // Mock the database module
    jest.doMock('../config/db', () => dbMock);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
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

  describe('POST /login - Authentication Tests', () => {
    beforeEach(async () => {
      // Create a test user with hashed password
      const userRepository = dbMock.getDataSource().getRepository('User');
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      
      const testUser = userRepository.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        mobileNumber: '1234567890',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        isMobileVerified: true,
        loginAttempts: 0,
        isLocked: false,
      });
      
      await userRepository.save(testUser);
    });

    it('should successfully login with email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'john.doe@example.com',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(SUCCESS_MESSAGES.LOGIN_SUCCESS);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe('john.doe@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should successfully login with mobile number', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: '1234567890',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(SUCCESS_MESSAGES.LOGIN_SUCCESS);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.mobileNumber).toBe('1234567890');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'invalid@example.com',
          password: 'TestPass123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('should fail with invalid mobile number', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: '9999999999',
          password: 'TestPass123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'john.doe@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('should fail with deactivated account', async () => {
      // Create a deactivated user
      const userRepository = dbMock.getDataSource().getRepository('User');
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      
      const testUser = userRepository.create({
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        mobileNumber: '5555555555',
        password: hashedPassword,
        role: 'user',
        isActive: false, // Deactivated
        isEmailVerified: true,
        isMobileVerified: true,
        loginAttempts: 0,
        isLocked: false,
      });
      
      await userRepository.save(testUser);

      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'bob.johnson@example.com',
          password: 'TestPass123!'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated');
    });

    it('should fail with locked account', async () => {
      // Create a locked user
      const userRepository = dbMock.getDataSource().getRepository('User');
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      
      const testUser = userRepository.create({
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown@example.com',
        mobileNumber: '1111111111',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        isMobileVerified: true,
        loginAttempts: 5,
        isLocked: true,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      });
      
      await userRepository.save(testUser);

      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'alice.brown@example.com',
          password: 'TestPass123!'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is temporarily locked due to multiple failed login attempts');
    });
  });

  describe('POST /login - Mock Response Validation', () => {
    beforeEach(async () => {
      // Create a test user
      const userRepository = dbMock.getDataSource().getRepository('User');
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      
      const testUser = userRepository.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        mobileNumber: '1234567890',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        isMobileVerified: true,
      });
      
      await userRepository.save(testUser);
    });

    it('should return proper mock response structure', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'john.doe@example.com',
          password: 'TestPass123!'
        })
        .expect(200);

      // Verify mock response structure
      expect(response.body).toMatchObject({
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        data: {
          user: {
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
    });

    it('should return mock JWT tokens', async () => {
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

    it('should return user data without sensitive information', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          emailOrMobile: 'john.doe@example.com',
          password: 'TestPass123!'
        })
        .expect(200);

      // Verify sensitive data is not included in response
      const userData = response.body.data.user;
      expect(userData).not.toHaveProperty('password');
      expect(userData).not.toHaveProperty('loginAttempts');
      expect(userData).not.toHaveProperty('isLocked');
      expect(userData).not.toHaveProperty('lockedUntil');
      expect(userData).not.toHaveProperty('refreshToken');
    });
  });

  describe('POST /login - Database Error Handling', () => {
    it('should return 500 when database is not connected', async () => {
      // Mock database connection failure
      const originalGetDataSource = dbMock.getDataSource;
      dbMock.getDataSource = jest.fn().mockReturnValue(null);

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

      // Restore original mock
      dbMock.getDataSource = originalGetDataSource;
    });
  });
}); 