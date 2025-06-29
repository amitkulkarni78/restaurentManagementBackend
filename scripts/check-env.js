require('dotenv').config();

console.log('🔍 Environment Variables Check:');
console.log('================================');

const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
];

const optionalEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
];

console.log('\n📋 Required Environment Variables:');
requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    console.log(`${status} ${varName}: ${value ? 'SET' : 'MISSING'}`);
});

console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '⚠️';
    console.log(`${status} ${varName}: ${value ? 'SET' : 'NOT SET'}`);
});

console.log('\n🌍 Current Environment:', process.env.NODE_ENV || 'development');
console.log('🚀 Port:', process.env.PORT || 3000);
console.log('🗄️ Database:', process.env.DB_NAME || 'restaurant_management');

// Check if all required vars are set
const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingRequired.length > 0) {
    console.log('\n❌ Missing required environment variables:', missingRequired.join(', '));
    process.exit(1);
} else {
    console.log('\n✅ All required environment variables are set!');
}