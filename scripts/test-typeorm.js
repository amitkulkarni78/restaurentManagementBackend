const { AppDataSource } = require('../dist/config/typeorm.config');

async function testTypeORM() {
    try {
        console.log('🔄 Initializing TypeORM...');

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('✅ TypeORM initialized successfully!');
        } else {
            console.log('✅ TypeORM already initialized!');
        }

        // Test getting a repository
        const userRepository = AppDataSource.getRepository('User');
        console.log('✅ User repository created successfully!');

        // Test database connection
        const isConnected = AppDataSource.isInitialized;
        console.log(`📊 Database connected: ${isConnected}`);

        // Get database stats
        const collections = await AppDataSource.driver.db.listCollections().toArray();
        console.log(`📚 Collections found: ${collections.length}`);
        collections.forEach(collection => {
            console.log(`  - ${collection.name}`);
        });

        console.log('🎉 TypeORM test completed successfully!');
    } catch (error) {
        console.error('❌ TypeORM test failed:', error);
        process.exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('🔌 TypeORM connection closed');
        }
        process.exit(0);
    }
}

testTypeORM();