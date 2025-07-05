require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_management';

    try {
        console.log('🔄 Testing MongoDB connection...');
        console.log(`📡 Connecting to: ${uri}`);

        const client = new MongoClient(uri);
        await client.connect();

        console.log('✅ MongoDB connection successful!');

        const db = client.db();
        const collections = await db.listCollections().toArray();

        console.log(`📚 Collections found: ${collections.length}`);
        collections.forEach(collection => {
            console.log(`  - ${collection.name}`);
        });

        await client.close();
        console.log('🔌 Connection closed');
        console.log('🎉 Connection test completed successfully!');

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
}

testConnection();