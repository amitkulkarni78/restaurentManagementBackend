import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import passport from 'passport';

// Import configurations and middleware
import logger from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import swaggerOptions from './config/swagger';
import './config/passport'; // Initialize passport strategies

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import couponRoutes from './routes/coupons';
import deliveryRoutes from './routes/deliveries';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport middleware
app.use(passport.initialize());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * @swagger
 * /test:
 *   get:
 *     summary: Test endpoint for Swagger
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Swagger is working!"
 */
app.get('/test', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Swagger is working!',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /create-admin-users:
 *   post:
 *     summary: Create default admin users (Development only)
 *     tags: [Development]
 *     responses:
 *       200:
 *         description: Admin users created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 adminCount:
 *                   type: number
 *       500:
 *         description: Server error
 */
app.post('/create-admin-users', async (req: Request, res: Response) => {
  const db = await require('./config/db').default;
  try {
    
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is not available in production',
      });
    }

    await db.createAdminUsersManually();
    const adminCount = await db.getAdminUserCount();

    res.status(200).json({
      success: true,
      message: 'Admin users created successfully',
      adminCount,
      credentials: {
        superAdmin: 'superadmin@restaurant.com',
        manager: 'manager@restaurant.com',
        password: 'admin123456'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admin users',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  return db.close().then(() => {
    res.status(501).json({
      status: 'ERROR',
      message: 'Database connection closed',
      error: 'close connection',
      timestamp: new Date().toISOString(),
    });
  });
});

// Database health check endpoint
app.get('/health/db', async (req: Request, res: Response) => {
  const db = await require('./config/db').default;
  try {
    const isConnected = db.isConnected();

    if (!isConnected) {
      return res.status(503).json({
        status: 'ERROR',
        message: 'Database not connected',
        timestamp: new Date().toISOString(),
      });
    }

    const stats = await db.getDatabaseStats();
    const collections = await db.listCollections();

    res.status(200).json({
      status: 'OK',
      message: 'Database is healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        name: stats && stats.database ? stats.database : 'unknown',
        collections: collections.length,
        dataSize: stats && stats.dataSize ? stats.dataSize : 0,
        storageSize: stats && stats.storageSize ? stats.storageSize : 0,
        indexes: stats && stats.indexes ? stats.indexes : 0,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
  return db.close().then(() => {
    res.status(501).json({
      status: 'ERROR',
      message: 'Database connection closed',
      error: 'close connection',
      timestamp: new Date().toISOString(),
    });
  });
});

// API routes
const apiVersion = process.env.API_VERSION || 'v1';
const apiPrefix = `/api/${apiVersion}`;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/payments`, paymentRoutes);
app.use(`${apiPrefix}/coupons`, couponRoutes);
app.use(`${apiPrefix}/deliveries`, deliveryRoutes);

// Swagger documentation
const specs = swaggerJsdoc(swaggerOptions as any);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Restaurant Management API Documentation',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
  },
}));

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use(errorHandler);

export default app; 