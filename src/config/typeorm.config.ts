import { DataSource, DataSourceOptions } from 'typeorm';
import 'reflect-metadata';

// Import all entities
import User from '../models/User';
import Order from '../models/Order';
import Category from '../models/Category';
import SubCategory from '../models/SubCategory';
import MenuItem from '../models/MenuItem';

// Base configuration
const baseConfig: DataSourceOptions = {
  type: 'mongodb',
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_management',
  database: process.env.DB_NAME || 'restaurant_management',
  entities: [User, Order, Category, SubCategory, MenuItem],
  synchronize: false, // Disable auto-synchronization to avoid index issues
  logging: process.env.NODE_ENV === 'development',
};

// Development configuration
export const developmentConfig: DataSourceOptions = {
  ...baseConfig,
  synchronize: false, // Keep disabled to avoid index issues
  logging: true,
};

// Production configuration
export const productionConfig: DataSourceOptions = {
  ...baseConfig,
  synchronize: false,
  logging: false,
};

// Test configuration
export const testConfig: DataSourceOptions = {
  ...baseConfig,
  synchronize: false, // Keep disabled to avoid index issues
  logging: false,
};

// Default configuration based on environment
const config = process.env.NODE_ENV === 'production' 
  ? productionConfig 
  : process.env.NODE_ENV === 'test'
  ? testConfig
  : developmentConfig;

// Create and export the data source
export const AppDataSource = new DataSource(config);

export default config; 