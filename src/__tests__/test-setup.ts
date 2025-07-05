import { MongoClient } from 'mongo-mock';
import { DataSource } from 'typeorm';
import User from '../models/User';
import Category from '../models/Category';
import SubCategory from '../models/SubCategory';
import MenuItem from '../models/MenuItem';
import Order from '../models/Order';

// Global test configuration
jest.setTimeout(30000);

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

// Test database setup using mongo-mock
export let mockMongoClient: MongoClient;
export let testDataSource: DataSource;

export const setupTestDatabase = async (): Promise<void> => {
  // Use environment variables from prod.env
  const testDbUrl = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test';
  const testDbName = process.env.DB_NAME || 'restaurant_management_test';
  
  console.log('Setting up test database with:', { testDbUrl, testDbName });

  // Create mock MongoDB client
  mockMongoClient = new MongoClient(testDbUrl);
  await mockMongoClient.connect();

  // Create test database connection using mongo-mock
  testDataSource = new DataSource({
    type: 'mongodb',
    url: testDbUrl,
    database: testDbName,
    entities: [User, Category, SubCategory, MenuItem, Order],
    synchronize: true,
    logging: false,
  });

  await testDataSource.initialize();
  console.log('Test database setup completed');
};

export const teardownTestDatabase = async (): Promise<void> => {
  if (testDataSource) {
    await testDataSource.destroy();
  }
  if (mockMongoClient) {
    await mockMongoClient.close();
  }
  console.log('Test database teardown completed');
};

export const clearTestData = async (): Promise<void> => {
  if (testDataSource) {
    const repositories = [
      testDataSource.getRepository('User'),
      testDataSource.getRepository('Category'),
      testDataSource.getRepository('SubCategory'),
      testDataSource.getRepository('MenuItem'),
      testDataSource.getRepository('Order'),
    ];

    for (const repository of repositories) {
      await repository.clear();
    }
    console.log('Test data cleared');
  }
};

// Mock database helper
export const createMockDatabase = () => {
  return {
    getDataSource: jest.fn().mockReturnValue(testDataSource),
  };
};

// Test user data
export const mockUserData = {
  validUser: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    mobileNumber: '1234567890',
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!',
    role: 'user'
  },
  validLoginData: {
    emailOrMobile: 'john.doe@example.com',
    password: 'TestPass123!'
  },
  invalidLoginData: {
    emailOrMobile: 'invalid@example.com',
    password: 'WrongPass123!'
  }
};

// Mock response helper
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock request helper
export const createMockRequest = (body: any = {}, params: any = {}, query: any = {}) => {
  return {
    body,
    params,
    query,
    headers: {},
    user: null,
  } as any;
}; 