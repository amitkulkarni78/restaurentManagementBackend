import express from 'express';
import multer from 'multer';
import { authenticateJWT, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import menuItemController from '../controllers/menuItemController';
import { UserRole } from '../types';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * @swagger
 * /api/v1/menu-items:
 *   get:
 *     summary: Get all menu items
 *     description: Retrieve all menu items with optional filtering and pagination
 *     tags: [Menu Items]
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter by active status (default true)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: subCategoryId
 *         schema:
 *           type: string
 *         description: Filter by subcategory ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: ["title", "price", "calories", "createdAt"]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: ["asc", "desc"]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Menu items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Menu items retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     menuItems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MenuItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', menuItemController.getAllMenuItems);

/**
 * @swagger
 * /api/v1/menu-items/{id}:
 *   get:
 *     summary: Get menu item by ID
 *     description: Retrieve a specific menu item by its ID
 *     tags: [Menu Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Menu item retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     menuItem:
 *                       $ref: '#/components/schemas/MenuItem'
 *       404:
 *         description: Menu item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', menuItemController.getMenuItemById);

/**
 * @swagger
 * /api/v1/menu-items:
 *   post:
 *     summary: Create a new menu item
 *     description: Create a new menu item (Admin and SuperAdmin only)
 *     tags: [Menu Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItemCreate'
 *           example:
 *             title: "Spaghetti Carbonara"
 *             description: "Classic Italian pasta with eggs, cheese, and pancetta"
 *             calories: 650
 *             price: 18.99
 *             ingredients: ["pasta", "eggs", "pecorino cheese", "pancetta", "black pepper"]
 *             categoryId: "category-id-here"
 *             subCategoryId: "subcategory-id-here"
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Menu item created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     menuItem:
 *                       $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category or subcategory not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - menu item already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateJWT, authorize(UserRole.ADMIN), asyncHandler(menuItemController.createMenuItem));

/**
 * @swagger
 * /api/v1/menu-items/{id}:
 *   put:
 *     summary: Update a menu item
 *     description: Update an existing menu item (Admin and SuperAdmin only)
 *     tags: [Menu Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItemUpdate'
 *           example:
 *             title: "Updated Spaghetti Carbonara"
 *             description: "Classic Italian pasta with eggs, cheese, and pancetta"
 *             calories: 650
 *             price: 19.99
 *             ingredients: ["pasta", "eggs", "pecorino cheese", "pancetta", "black pepper"]
 *             categoryId: "category-id-here"
 *             subCategoryId: "subcategory-id-here"
 *             activeFlag: true
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Menu item updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     menuItem:
 *                       $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Menu item, category, or subcategory not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - menu item already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticateJWT, authorize(UserRole.ADMIN), asyncHandler(menuItemController.updateMenuItem));

/**
 * @swagger
 * /api/v1/menu-items/{id}:
 *   delete:
 *     summary: Delete a menu item
 *     description: Delete a menu item (Admin and SuperAdmin only)
 *     tags: [Menu Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Menu item deleted successfully
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Menu item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateJWT, authorize(UserRole.ADMIN), asyncHandler(menuItemController.deleteMenuItem));

/**
 * @swagger
 * /api/v1/menu-items/{menuItemId}/images:
 *   post:
 *     summary: Upload images for menu item
 *     description: Upload multiple images for a specific menu item (Admin and SuperAdmin only)
 *     tags: [Menu Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files to upload (max 5 files, 5MB each)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Images uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedImages:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *                       description: URLs of uploaded images
 *                     totalImages:
 *                       type: integer
 *                       description: Total number of images for the menu item
 *       400:
 *         description: Bad request - no images provided or invalid files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Menu item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:menuItemId/images', 
  authenticateJWT, 
  authorize(UserRole.ADMIN), 
  upload.array('images', 5), 
  asyncHandler(menuItemController.uploadImages)
);

/**
 * @swagger
 * /api/v1/menu-items/{menuItemId}/images/{imageUrl}:
 *   delete:
 *     summary: Remove image from menu item
 *     description: Remove a specific image from a menu item (Admin and SuperAdmin only)
 *     tags: [Menu Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item ID
 *       - in: path
 *         name: imageUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: URL of the image to remove (URL encoded)
 *     responses:
 *       200:
 *         description: Image removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Image removed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     remainingImages:
 *                       type: integer
 *                       description: Number of remaining images
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Menu item or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:menuItemId/images/:imageUrl', 
  authenticateJWT, 
  authorize(UserRole.ADMIN), 
  asyncHandler(menuItemController.removeImage)
);

/**
 * @swagger
 * /api/v1/menu-items/statistics/overview:
 *   get:
 *     summary: Get menu item statistics
 *     description: Get comprehensive statistics about menu items including counts and price statistics
 *     tags: [Menu Items]
 *     responses:
 *       200:
 *         description: Menu item statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Menu item statistics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/MenuItemStatistics'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/statistics/overview', menuItemController.getMenuItemStatistics);

export default router; 