import 'dotenv/config';
import 'reflect-metadata';
import app from './app';
import logger from './utils/logger';
import { initializeFirebase } from './config/firebase';
import db from './config/db';

// Initialize Firebase
initializeFirebase();

// Connect to MongoDB and initialize database
const connectDB = async (): Promise<void> => {
  try {
    await db.connect();
    logger.info('✅ Database connection and initialization completed');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 3000;

// Graceful shutdown handling
const gracefulShutdown = (signal: string): void => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed.');
    db.disconnect()
      .then(() => {
        logger.info('Database connection closed.');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Error during database disconnection:', err);
        process.exit(1);
      });
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Restaurant Management API server running on port ${PORT}`);
  logger.info(`📚 API Documentation available at http://localhost:${PORT}/docs`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Connect to database and initialize
connectDB();

export default server; 