describe('Environment Configuration Tests', () => {
  test('should load prod.env file correctly', () => {
    // Verify that environment variables from prod.env are loaded
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.PORT).toBe('3001');
    expect(process.env.MONGODB_URI_TEST).toBeDefined();
    expect(process.env.DB_NAME).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.FIREBASE_PROJECT_ID).toBeDefined();
  });

  test('should have correct database configuration', () => {
    expect(process.env.MONGODB_URI_TEST).toContain('mongodb://admin:password123@localhost:27017/restaurant_management_test');
    expect(process.env.DB_NAME).toBe('restaurant_management');
  });

  test('should have JWT configuration', () => {
    expect(process.env.JWT_SECRET).toBe('nTgFhbpJDkbqueEf');
    expect(process.env.JWT_REFRESH_SECRET).toBe('25PcXmFZQSjajJZR');
  });

  test('should have Firebase configuration', () => {
    expect(process.env.FIREBASE_PROJECT_ID).toBe('projectx-60709');
    expect(process.env.FIREBASE_API_KEY).toBeDefined();
  });
}); 