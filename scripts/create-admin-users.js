#!/usr/bin/env node

/**
 * Standalone script to create admin users
 * Usage: node scripts/create-admin-users.js
 */

require('dotenv/config');
const bcrypt = require('bcryptjs');

// Simple MongoDB connection for this script
const { MongoClient } = require('mongodb');

async function createAdminUsers() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_management';
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(process.env.DB_NAME || 'restaurant_management');
        const userCollection = db.collection('User');

        // Check if admin users already exist
        const adminCount = await userCollection.countDocuments({ role: 'admin' });

        if (adminCount > 0) {
            console.log(`⚠️  ${adminCount} admin user(s) already exist. Skipping creation.`);
            return;
        }

        // Create admin users
        const hashedPassword = await bcrypt.hash('admin123456', 10);

        const adminUsers = [{
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

        const result = await userCollection.insertMany(adminUsers);

        console.log('👥 Default admin users created successfully!');
        console.log('📧 Super Admin: superadmin@restaurant.com');
        console.log('📧 Restaurant Manager: manager@restaurant.com');
        console.log('🔑 Password for both: admin123456');
        console.log(`📊 Created ${result.insertedCount} admin users`);

    } catch (error) {
        console.error('❌ Error creating admin users:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('✅ MongoDB connection closed');
    }
}

// Run the script
createAdminUsers();