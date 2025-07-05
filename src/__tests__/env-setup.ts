import { config } from 'dotenv';
import { resolve } from 'path';

// Load prod.env file for tests
config({ path: resolve(__dirname, '../../.prod.env') });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port for tests

// Override database configuration for tests
process.env.MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test';
process.env.DB_NAME = process.env.DB_NAME || 'restaurant_management_test';

// Ensure JWT secrets are set for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

// Set test-specific Firebase configuration
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-project';
process.env.FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'test-api-key';

// Log the environment configuration for debugging
console.log('Test Environment Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI_TEST:', process.env.MONGODB_URI_TEST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID); 