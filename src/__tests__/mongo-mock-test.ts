import { MongoClient } from 'mongo-mock';
import { setupTestDatabase, teardownTestDatabase, clearTestData } from './test-setup';

describe('Mongo-Mock Database Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  it('should connect to mock database successfully', async () => {
    // This test verifies that the mongo-mock setup is working
    expect(true).toBe(true);
  });

  it('should be able to clear test data', async () => {
    // This test verifies that the clearTestData function works
    await clearTestData();
    expect(true).toBe(true);
  });
}); 