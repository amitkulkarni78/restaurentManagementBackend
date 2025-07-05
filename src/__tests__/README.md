# Test Configuration

This directory contains the test setup and configuration for the restaurant management backend.

## Environment Configuration

The tests are configured to use the `.prod.env` file for environment variables. This ensures that tests run with production-like configuration while using test-specific values where needed.

### Files

- `env-setup.ts` - Loads the prod.env file and sets test-specific environment variables
- `test-setup.ts` - Main test setup with database configuration and mocks
- `setup.ts` - Alternative test setup (duplicate of test-setup.ts)
- `jest.config.ts` - Jest configuration that loads the env-setup.ts file

### Environment Variables Used

The following environment variables from `.prod.env` are used in tests:

- `NODE_ENV` - Set to 'test' for test environment
- `PORT` - Set to '3001' for tests (different from production)
- `MONGODB_URI_TEST` - Test database connection string
- `DB_NAME` - Database name for tests
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_API_KEY` - Firebase API key

### Test Database Configuration

Tests use a mock MongoDB setup with the following configuration:

```typescript
const testDbUrl = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test';
const testDbName = process.env.DB_NAME || 'restaurant_management_test';
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=env-test.test.ts

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- `env-test.test.ts` - Verifies environment configuration
- `simple-login-mock.test.ts` - Login API tests with mocks
- `mongo-mock-test.ts` - MongoDB mock tests

### Mock Configuration

The tests use the following mocks:

- Firebase OTP service
- JWT token generation and verification
- Logger functions
- Database connections (using mongo-mock)

### Environment Setup Process

1. `jest.config.ts` loads `env-setup.ts` as a setup file
2. `env-setup.ts` loads the `.prod.env` file using dotenv
3. Test-specific environment variables are set
4. Tests can access all environment variables from prod.env
5. Database connections use the configured test database URL

This setup ensures that tests have access to all production configuration while maintaining test isolation. 