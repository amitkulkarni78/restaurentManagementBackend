import express from 'express';
import { authenticateJWT, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import subCategoryController from '../controllers/subCategoryController';
import { UserRole } from '../types';

const router = express.Router();

/**
 * @swagger
 * /api/v1/subcategories:
 *   get:
 *     summary: Get all subcategories
 *     description: Retrieve all subcategories with optional filtering by active status
 *     tags: [SubCategories]
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
 *     responses:
 *       200:
 *         description: Subcategories retrieved successfully
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
 *                   example: Subcategories retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     subcategories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SubCategory'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', subCategoryController.getAllSubCategories);

/**
 * @swagger
 * /api/v1/subcategories/{id}:
 *   get:
 *     summary: Get subcategory by ID
 *     description: Retrieve a specific subcategory by its ID
 *     tags: [SubCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *     responses:
 *       200:
 *         description: Subcategory retrieved successfully
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
 *                   example: Subcategory retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     subcategory:
 *                       $ref: '#/components/schemas/SubCategory'
 *       404:
 *         description: Subcategory not found
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
router.get('/:id', subCategoryController.getSubCategoryById);

/**
 * @swagger
 * /api/v1/subcategories:
 *   post:
 *     summary: Create a new subcategory
 *     description: Create a new subcategory (Admin and SuperAdmin only)
 *     tags: [SubCategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubCategoryCreate'
 *           example:
 *             title: "Pasta"
 *             categoryId: "category-id-here"
 *     responses:
 *       201:
 *         description: Subcategory created successfully
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
 *                   example: Subcategory created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     subcategory:
 *                       $ref: '#/components/schemas/SubCategory'
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
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - subcategory already exists
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
router.post('/', authenticateJWT, authorize(UserRole.ADMIN), asyncHandler(subCategoryController.createSubCategory));

/**
 * @swagger
 * /api/v1/subcategories/{id}:
 *   put:
 *     summary: Update a subcategory
 *     description: Update an existing subcategory (Admin and SuperAdmin only)
 *     tags: [SubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubCategoryUpdate'
 *           example:
 *             title: "Updated Pasta"
 *             categoryId: "category-id-here"
 *             activeFlag: true
 *     responses:
 *       200:
 *         description: Subcategory updated successfully
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
 *                   example: Subcategory updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     subcategory:
 *                       $ref: '#/components/schemas/SubCategory'
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
 *         description: Subcategory or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - subcategory already exists
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
router.put('/:id', authenticateJWT, authorize(UserRole.ADMIN), asyncHandler(subCategoryController.updateSubCategory));

/**
 * @swagger
 * /api/v1/subcategories/{id}:
 *   delete:
 *     summary: Delete a subcategory
 *     description: Delete a subcategory (Admin and SuperAdmin only)
 *     tags: [SubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *     responses:
 *       200:
 *         description: Subcategory deleted successfully
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
 *                   example: Subcategory deleted successfully
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
 *         description: Subcategory not found
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
router.delete('/:id', authenticateJWT, authorize(UserRole.ADMIN), asyncHandler(subCategoryController.deleteSubCategory));

/**
 * @swagger
 * /api/v1/subcategories/category/{categoryId}:
 *   get:
 *     summary: Get subcategories by category ID
 *     description: Retrieve all subcategories for a specific category
 *     tags: [SubCategories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter by active status (default true)
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
 *     responses:
 *       200:
 *         description: Subcategories retrieved successfully
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
 *                   example: Subcategories retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     subcategories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SubCategory'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       404:
 *         description: Category not found
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
router.get('/category/:categoryId', subCategoryController.getSubCategoriesByCategory);

/**
 * @swagger
 * /api/v1/subcategories/statistics/overview:
 *   get:
 *     summary: Get subcategory statistics
 *     description: Get comprehensive statistics about subcategories including counts and related data
 *     tags: [SubCategories]
 *     responses:
 *       200:
 *         description: Subcategory statistics retrieved successfully
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
 *                   example: Subcategory statistics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/SubCategoryStatistics'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/statistics/overview', subCategoryController.getSubCategoryStatistics);

export default router; 