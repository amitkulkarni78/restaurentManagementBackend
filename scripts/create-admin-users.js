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

        // Insert users one by one to handle potential duplicates
        let createdCount = 0;
        for (const adminUser of adminUsers) {
            try {
                // Check if user already exists
                const existingUser = await userCollection.findOne({
                    $or: [
                        { email: adminUser.email },
                        { mobileNumber: adminUser.mobileNumber }
                    ]
                });

                if (!existingUser) {
                    await userCollection.insertOne(adminUser);
                    console.log(`✅ Created admin user: ${adminUser.email}`);
                    createdCount++;
                } else {
                    console.log(`⚠️  Admin user already exists: ${adminUser.email}`);
                }
            } catch (userError) {
                console.error(`❌ Error creating admin user ${adminUser.email}:`, userError);
            }
        }

        if (createdCount > 0) {
            console.log('👥 Admin users created successfully!');
            console.log('📧 Super Admin: superadmin@restaurant.com');
            console.log('📧 Restaurant Manager: manager@restaurant.com');
            console.log('🔑 Password for both: admin123456');
            console.log(`📊 Created ${createdCount} admin users`);
        } else {
            console.log('ℹ️  No new admin users were created (all already exist)');
        }

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