import { DataSource } from 'typeorm';
import logger from '../utils/logger';
import { USER_ROLES } from '../utils/constants';
import { AppDataSource } from './typeorm.config';

class Database {
  private dataSource: DataSource | null = null;

  async connect(): Promise<DataSource> {
    try {
      // Initialize the data source using the centralized config
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      
      this.dataSource = AppDataSource;
      logger.info('✅ TypeORM MongoDB connection established successfully');

      // Initialize default data
      await this.initializeDefaultData();

      return this.dataSource;
    } catch (error) {
      logger.error('❌ TypeORM MongoDB connection failed:', error);
      throw error;
    }
  }

  async initializeDefaultData(): Promise<void> {
    try {
      if (!this.dataSource) {
        throw new Error('DataSource not initialized');
      }

      // Get repositories using string names for MongoDB compatibility
      const userRepository = this.dataSource.getRepository('User');

      // Check if admin users exist
      const adminCount = await userRepository.count({
        where: { role: 'admin' }
      });

      if (adminCount === 0) {
        await this.createDefaultAdminUsers(userRepository);
      }

      logger.info('✅ Default data initialized successfully');
    } catch (error) {
      logger.error('Error initializing default data:', error);
      // Don't throw error, just log it to avoid blocking the server startup
    }
  }

  async createDefaultAdminUsers(userRepository: any): Promise<void> {
    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123456', 10) as string;

      const adminUsers = [
        {
          firstName: 'Super',
          lastName: 'Admin',
          email: 'superadmin@restaurant.com',
          mobileNumber: '1234567890',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          isEmailVerified: true,
          isMobileVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          firstName: 'Restaurant',
          lastName: 'Manager',
          email: 'manager@restaurant.com',
          mobileNumber: '1234567891',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          isEmailVerified: true,
          isMobileVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Use insertMany instead of individual save operations to avoid createValueMap issues
      for (const adminUser of adminUsers) {
        try {
          // Use the MongoDB driver directly to avoid TypeORM issues
          const mongoDriver = (this.dataSource as any).driver;
          const collection = mongoDriver.db.collection('User');
          
          // Check if user already exists
          const existingUser = await collection.findOne({ 
            $or: [
              { email: adminUser.email },
              { mobileNumber: adminUser.mobileNumber }
            ]
          });

          if (!existingUser) {
            await collection.insertOne(adminUser);
            logger.info(`✅ Created admin user: ${adminUser.email}`);
          } else {
            logger.info(`⚠️  Admin user already exists: ${adminUser.email}`);
          }
        } catch (userError) {
          logger.error(`Error creating admin user ${adminUser.email}:`, userError);
        }
      }

      logger.info('👥 Default admin users creation completed');
      logger.info('📧 Super Admin: superadmin@restaurant.com');
      logger.info('📧 Restaurant Manager: manager@restaurant.com');
      logger.info('🔑 Password for both: admin123456');
    } catch (error) {
      logger.error('Error creating admin users:', error);
      // Don't throw error, just log it
    }
  }

  async getDatabaseStats(): Promise<any> {
    try {
      if (!this.dataSource) {
        throw new Error('DataSource not initialized');
      }

      const userRepository = this.dataSource.getRepository('User');
      const orderRepository = this.dataSource.getRepository('Order');

      const userCount = await userRepository.count();
      const orderCount = await orderRepository.count();

      return {
        users: userCount,
        orders: orderCount,
        database: this.dataSource.options.database || 'unknown',
        type: this.dataSource.options.type || 'unknown'
      };
    } catch (error) {
      logger.error('Error getting database stats:', error);
      return null;
    }
  }

  async listCollections(): Promise<string[]> {
    try {
      if (!this.dataSource) {
        throw new Error('DataSource not initialized');
      }

      // Use MongoDB driver directly for listing collections
      const mongoDriver = (this.dataSource.driver as any);
      const collections = await mongoDriver.db.listCollections().toArray();
      return collections.map((collection: any) => collection.name);
    } catch (error) {
      logger.error('Error listing collections:', error);
      return [];
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        logger.info('✅ TypeORM MongoDB connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.dataSource?.isInitialized || false;
  }

  getDataSource(): DataSource | null {
    return this.dataSource;
  }

  // Utility method to manually create admin users
  async createAdminUsersManually(): Promise<void> {
    try {
      if (!this.dataSource) {
        throw new Error('DataSource not initialized');
      }

      const userRepository = this.dataSource.getRepository('User');
      await this.createDefaultAdminUsers(userRepository);
      
      logger.info('✅ Admin users created manually');
    } catch (error) {
      logger.error('Error creating admin users manually:', error);
      throw error;
    }
  }

  // Utility method to check admin user count
  async getAdminUserCount(): Promise<number> {
    try {
      if (!this.dataSource) {
        throw new Error('DataSource not initialized');
      }

      const userRepository = this.dataSource.getRepository('User');
      return await userRepository.count({
        where: { role: 'admin' }
      });
    } catch (error) {
      logger.error('Error getting admin user count:', error);
      return 0;
    }
  }
}

// Create and export a singleton instance
const db = new Database();
export default db; 