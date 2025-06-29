import { Options } from 'swagger-jsdoc';

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant Management API',
      version: '1.0.0',
      description: 'Complete restaurant management backend API with authentication, RBAC, and order management',
      contact: {
        name: 'API Support',
        email: 'support@restaurant-api.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [{
      url: process.env.APP_URL || 'http://localhost:3000',
      description: 'Development server',
    }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            mobileNumber: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'staff', 'user'] },
            isActive: { type: 'boolean' },
            isEmailVerified: { type: 'boolean' },
            profilePicture: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            userId: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  menuItemId: { type: 'string' },
                  name: { type: 'string' },
                  quantity: { type: 'number' },
                  unitPrice: { type: 'number' },
                  totalPrice: { type: 'number' },
                },
              },
            },
            orderType: { type: 'string', enum: ['dine_in', 'takeaway', 'delivery'] },
            status: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'] },
            totalAmount: { type: 'number' },
            taxAmount: { type: 'number' },
            discountAmount: { type: 'number' },
            finalAmount: { type: 'number' },
            paymentStatus: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'refunded'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderId: { type: 'string' },
            userId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            paymentMethod: { type: 'string', enum: ['cash', 'card', 'digital_wallet', 'bank_transfer'] },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'refunded'] },
            transactionId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Coupon: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            discountType: { type: 'string', enum: ['percentage', 'fixed_amount'] },
            discountValue: { type: 'number' },
            maxUsage: { type: 'number' },
            currentUsage: { type: 'number' },
            minOrderAmount: { type: 'number' },
            validFrom: { type: 'string', format: 'date-time' },
            validUntil: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Delivery: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderId: { type: 'string' },
            deliveryPersonId: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled', 'completed'] },
            deliveryAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' },
                instructions: { type: 'string' },
              },
            },
            deliveryFee: { type: 'number' },
            estimatedDeliveryTime: { type: 'string', format: 'date-time' },
            actualDeliveryTime: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', maxLength: 100 },
            activeFlag: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['title'],
        },
        SubCategory: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', maxLength: 100 },
            categoryId: { type: 'string' },
            activeFlag: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['title', 'categoryId'],
        },
        MenuItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', maxLength: 200 },
            description: { type: 'string' },
            calories: { type: 'integer', minimum: 0 },
            price: { type: 'number', minimum: 0, format: 'decimal' },
            ingredients: {
              type: 'array',
              items: { type: 'string' },
            },
            pictureLinks: {
              type: 'array',
              items: { type: 'string', format: 'uri' },
            },
            categoryId: { type: 'string' },
            subCategoryId: { type: 'string' },
            activeFlag: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['title', 'description', 'calories', 'price', 'categoryId'],
        },
        CategoryCreate: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 100 },
          },
          required: ['title'],
        },
        CategoryUpdate: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 100 },
            activeFlag: { type: 'boolean' },
          },
        },
        SubCategoryCreate: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 100 },
            categoryId: { type: 'string' },
          },
          required: ['title', 'categoryId'],
        },
        SubCategoryUpdate: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 100 },
            categoryId: { type: 'string' },
            activeFlag: { type: 'boolean' },
          },
        },
        MenuItemCreate: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 200 },
            description: { type: 'string' },
            calories: { type: 'integer', minimum: 0 },
            price: { type: 'number', minimum: 0 },
            ingredients: {
              type: 'array',
              items: { type: 'string' },
            },
            categoryId: { type: 'string' },
            subCategoryId: { type: 'string' },
          },
          required: ['title', 'description', 'calories', 'price', 'categoryId'],
        },
        MenuItemUpdate: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 200 },
            description: { type: 'string' },
            calories: { type: 'integer', minimum: 0 },
            price: { type: 'number', minimum: 0 },
            ingredients: {
              type: 'array',
              items: { type: 'string' },
            },
            categoryId: { type: 'string' },
            subCategoryId: { type: 'string' },
            activeFlag: { type: 'boolean' },
          },
        },
        CategoryStatistics: {
          type: 'object',
          properties: {
            totalCategories: { type: 'integer' },
            activeCategories: { type: 'integer' },
            inactiveCategories: { type: 'integer' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  activeFlag: { type: 'boolean' },
                  subCategoryCount: { type: 'integer' },
                  menuItemCount: { type: 'integer' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        SubCategoryStatistics: {
          type: 'object',
          properties: {
            totalSubCategories: { type: 'integer' },
            activeSubCategories: { type: 'integer' },
            inactiveSubCategories: { type: 'integer' },
            subCategories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  categoryId: { type: 'string' },
                  activeFlag: { type: 'boolean' },
                  menuItemCount: { type: 'integer' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        MenuItemStatistics: {
          type: 'object',
          properties: {
            totalMenuItems: { type: 'integer' },
            activeMenuItems: { type: 'integer' },
            inactiveMenuItems: { type: 'integer' },
            priceStats: {
              type: 'object',
              properties: {
                average: { type: 'string' },
                minimum: { type: 'string' },
                maximum: { type: 'string' },
              },
            },
          },
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: [
    './src/routes/*.ts',
    './src/models/*.ts',
    './src/controllers/*.ts',
    './src/app.ts'
  ]
};

export default swaggerOptions; 