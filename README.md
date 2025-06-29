# Restaurant Management Backend API

A complete backend REST API server for restaurant management built with **Node.js**, **Express**, **MongoDB**, and **TypeScript**. This project provides a robust, scalable, and production-ready solution for restaurant management systems.

## 🚀 Features

- **🔐 Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - OAuth integration (Google, Facebook)
  - Password reset functionality
  - Email and mobile verification

- **👥 User Management**
  - User registration and login
  - Profile management
  - Role-based permissions (Admin, Staff, User)
  - User preferences and settings

- **🪑 Table Management**
  - Table reservation system
  - Real-time availability tracking
  - Table status management
  - Section-based organization

- **📋 Order Management**
  - Order creation and tracking
  - Multiple order types (Dine-in, Takeaway, Delivery)
  - Order status workflow
  - Real-time order updates

- **💳 Payment Processing**
  - Multiple payment methods
  - Payment status tracking
  - Refund processing
  - Payment gateway integration

- **🎫 Coupon & Promotion System**
  - Coupon code management
  - Discount calculations
  - Usage tracking and limits
  - Validity period management

- **🚚 Delivery Management**
  - Delivery tracking
  - Delivery person assignment
  - Delivery status updates
  - Address management

- **📊 Additional Features**
  - Real-time notifications
  - File upload support
  - Comprehensive logging
  - Health monitoring
  - API documentation (Swagger)
  - Rate limiting and security

## 🛠 Tech Stack

### Core Technologies
- **Node.js** (v18+) - Runtime environment
- **TypeScript** (v5.1+) - Type-safe JavaScript
- **Express.js** (v4.18+) - Web framework
- **MongoDB** (v6.0+) - NoSQL database
- **TypeORM** (v0.3+) - Object-Relational Mapping

### Authentication & Security
- **JWT** - JSON Web Tokens
- **Passport.js** - Authentication middleware
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Validation & Documentation
- **Yup** - Schema validation
- **Swagger/OpenAPI** - API documentation
- **class-validator** - Decorator-based validation

### Utilities & Services
- **Winston** - Logging
- **Multer** - File uploads
- **Twilio** - SMS services
- **Nodemailer** - Email services
- **Firebase Admin** - Push notifications
- **Stripe** - Payment processing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **ts-node-dev** - Development server

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **MongoDB** (v6.0 or higher)
- **Docker** (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd restaurant-management-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the environment example file and configure your variables:

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://admin:password123@localhost:27017/restaurant_management?authSource=admin
DB_NAME=restaurant_management
MONGODB_USERNAME=admin
MONGODB_PASSWORD=password123

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Add other required environment variables...
```

### 4. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start MongoDB with Docker Compose
docker-compose up mongodb -d

# Or start all services
docker-compose up -d
```

#### Option B: Local MongoDB

1. Install MongoDB locally
2. Create a database named `restaurant_management`
3. Create a user with appropriate permissions

### 5. Build and Run

#### Development Mode

```bash
# Start development server with hot reload
npm run dev
```

#### Production Mode

```bash
# Build the TypeScript application
npm run build

# Start production server
npm start
```

### 6. Verify Installation

- **API Server**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health
- **Database Health**: http://localhost:3000/health/db

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

### Using Docker Only

```bash
# Build the image
docker build -t restaurant-management-api .

# Run the container
docker run -p 3000:3000 restaurant-management-api
```

## 📚 API Documentation

The API documentation is automatically generated using Swagger/OpenAPI and is available at:

**http://localhost:3000/docs**

### Key API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/forgot-password` - Forgot password
- `POST /api/v1/auth/reset-password` - Reset password

#### Users
- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

#### Tables
- `GET /api/v1/tables` - Get all tables
- `POST /api/v1/tables` - Create table (Admin/Staff)
- `GET /api/v1/tables/:id` - Get table by ID
- `PUT /api/v1/tables/:id` - Update table
- `DELETE /api/v1/tables/:id` - Delete table (Admin only)

#### Orders
- `GET /api/v1/orders` - Get all orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order by ID
- `PUT /api/v1/orders/:id` - Update order
- `DELETE /api/v1/orders/:id` - Cancel order

#### Payments
- `GET /api/v1/payments` - Get all payments
- `POST /api/v1/payments` - Process payment
- `GET /api/v1/payments/:id` - Get payment by ID
- `POST /api/v1/payments/:id/refund` - Process refund

#### Coupons
- `GET /api/v1/coupons` - Get all coupons
- `POST /api/v1/coupons` - Create coupon (Admin only)
- `GET /api/v1/coupons/:code` - Validate coupon
- `PUT /api/v1/coupons/:id` - Update coupon
- `DELETE /api/v1/coupons/:id` - Delete coupon

#### Deliveries
- `GET /api/v1/deliveries` - Get all deliveries
- `POST /api/v1/deliveries` - Create delivery
- `GET /api/v1/deliveries/:id` - Get delivery by ID
- `PUT /api/v1/deliveries/:id` - Update delivery status

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build TypeScript to JavaScript
npm run build:watch      # Build with file watching
npm run clean            # Clean build directory

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
npm run docker:compose   # Start with Docker Compose
```

### Project Structure

```
src/
├── config/              # Configuration files
│   ├── db.ts           # Database configuration
│   ├── firebase.ts     # Firebase configuration
│   ├── jwt.ts          # JWT configuration
│   ├── passport.ts     # Passport configuration
│   └── swagger.ts      # Swagger configuration
├── controllers/         # Route controllers
│   ├── authController.ts
│   ├── userController.ts
│   ├── tableController.ts
│   ├── orderController.ts
│   ├── paymentController.ts
│   ├── couponController.ts
│   └── deliveryController.ts
├── middlewares/         # Custom middleware
│   ├── auth.ts         # Authentication middleware
│   └── errorHandler.ts # Error handling middleware
├── models/             # TypeORM entities
│   ├── User.ts
│   ├── Table.ts
│   └── Order.ts
├── routes/             # API routes
│   ├── auth.ts
│   ├── users.ts
│   ├── tables.ts
│   ├── orders.ts
│   ├── payments.ts
│   ├── coupons.ts
│   └── deliveries.ts
├── services/           # Business logic services
│   ├── firebaseOTPService.ts
│   └── otpService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── constants.ts
│   └── logger.ts
├── validations/        # Validation schemas
│   └── auth.ts
├── app.ts              # Express app configuration
└── server.ts           # Server entry point
```

### TypeScript Configuration

The project uses strict TypeScript configuration with:

- **Strict mode** enabled
- **ES2020** target
- **CommonJS** modules
- **Path mapping** for clean imports
- **Decorator support** for TypeORM
- **Source maps** for debugging

### Code Style

The project follows consistent code style with:

- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** strict rules
- **Conventional** naming conventions

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
src/__tests__/
├── setup.ts            # Test setup
├── auth.test.ts        # Authentication tests
├── users.test.ts       # User management tests
├── tables.test.ts      # Table management tests
└── orders.test.ts      # Order management tests
```

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - DDoS protection
- **Input Validation** - XSS protection
- **JWT Security** - Token-based authentication
- **Password Hashing** - bcrypt encryption
- **SQL Injection Protection** - TypeORM parameterization

## 📊 Monitoring & Logging

### Health Checks

- **Application Health**: `/health`
- **Database Health**: `/health/db`

### Logging

The application uses Winston for structured logging:

- **Console logging** in development
- **File logging** in production
- **Request logging** middleware
- **Error logging** with stack traces

### Metrics

- **Request/Response times**
- **Error rates**
- **Database connection status**
- **Memory usage**

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure secure JWT secrets
- [ ] Set up MongoDB with authentication
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure logging and monitoring
- [ ] Set up backup strategies
- [ ] Configure rate limiting
- [ ] Set up health checks

### Environment Variables

Make sure to configure all required environment variables for production:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://user:pass@host:port/db?authSource=admin
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
ALLOWED_ORIGINS=https://yourdomain.com
# ... other production variables
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Add proper error handling
- Include input validation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the health check endpoints
- Check the application logs

## 🔄 Changelog

### Version 2.0.0 (TypeScript Conversion)
- ✅ Converted entire project to TypeScript
- ✅ Added comprehensive type definitions
- ✅ Improved build process and tooling
- ✅ Enhanced code quality with strict typing
- ✅ Updated development workflow
- ✅ Added TypeScript-specific configurations

### Version 1.0.0 (Initial Release)
- ✅ Complete REST API implementation
- ✅ Authentication and authorization
- ✅ User and table management
- ✅ Order and payment processing
- ✅ Coupon and delivery systems
- ✅ Docker support and documentation

---

**Built with ❤️ using TypeScript, Node.js, and Express** 