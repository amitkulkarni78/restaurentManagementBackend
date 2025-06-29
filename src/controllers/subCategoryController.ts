import { Request, Response } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { AppError } from '../middlewares/errorHandler';
import db from '../config/db';
import logger from '../utils/logger';
class SubCategoryController {
  // Get all subcategories
  async getAllSubCategories(req: Request, res: Response): Promise<void> {
    try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const subCategoryRepository = dataSource.getRepository('SubCategory');
    
    const { categoryId, activeOnly = 'true' } = req.query;
    const whereCondition: any = {};
    
    if (activeOnly === 'true') {
      whereCondition.activeFlag = true;
    }
    
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    const subCategories = await subCategoryRepository.find({
      where: whereCondition,
      order: {
        title: 'ASC',
      },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subcategories retrieved successfully',
      data: {
        subCategories,
        count: subCategories.length,
      },
    });
  } catch (error) {
    logger.error('Error retrieving subcategories:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Get subcategory by ID
  async getSubCategoryById(req: Request, res: Response): Promise<void> {
    try {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const subCategoryRepository = dataSource.getRepository('SubCategory');
    
    const subCategory = await subCategoryRepository.findOne({
      where: { id },
    });

    if (!subCategory) {
      throw new AppError('Subcategory not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subcategory retrieved successfully',
      data: {
        subCategory,
      },
    });
  } catch (error) {
    logger.error('Error retrieving subcategory:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Create new subcategory
  async createSubCategory(req: Request, res: Response): Promise<void> {
    try {
    const { title, categoryId } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const subCategoryRepository = dataSource.getRepository('SubCategory');
    const categoryRepository = dataSource.getRepository('Category');

    // Verify parent category exists
    const parentCategory = await categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!parentCategory) {
      throw new AppError('Parent category not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!parentCategory.activeFlag) {
      throw new AppError('Cannot create subcategory under inactive category', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if subcategory with same title already exists in this category
    const existingSubCategory = await subCategoryRepository.findOne({
      where: { title, categoryId },
    });

    if (existingSubCategory) {
      throw new AppError('Subcategory with this title already exists in this category', HTTP_STATUS.CONFLICT);
    }

    // Create new subcategory
    const subCategory = subCategoryRepository.create({
      title,
      categoryId,
      activeFlag: true,
    });

    const savedSubCategory = await subCategoryRepository.save(subCategory);

    logger.info(`New subcategory created: ${savedSubCategory.title} under category: ${parentCategory.title}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Subcategory created successfully',
      data: {
        subCategory: savedSubCategory,
        parentCategory: {
          id: parentCategory.id,
          title: parentCategory.title,
        },
      },
    });
  } catch (error) {
    logger.error('Error creating subcategory:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Update subcategory
  async updateSubCategory(req: Request, res: Response): Promise<void> {
    try {
    const { id } = req.params;
    const { title, categoryId, activeFlag } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const subCategoryRepository = dataSource.getRepository('SubCategory');
    const categoryRepository = dataSource.getRepository('Category');

    // Find subcategory
    const subCategory = await subCategoryRepository.findOne({
      where: { id },
    });

    if (!subCategory) {
      throw new AppError('Subcategory not found', HTTP_STATUS.NOT_FOUND);
    }

    // If changing category, verify new parent category exists
    if (categoryId && categoryId !== subCategory.categoryId) {
      const newParentCategory = await categoryRepository.findOne({
        where: { id: categoryId },
      });

      if (!newParentCategory) {
        throw new AppError('New parent category not found', HTTP_STATUS.NOT_FOUND);
      }

      if (!newParentCategory.activeFlag) {
        throw new AppError('Cannot move subcategory to inactive category', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Check if new title conflicts with existing subcategory in the same category
    if (title && title !== subCategory.title) {
      const existingSubCategory = await subCategoryRepository.findOne({
        where: { title, categoryId: categoryId || subCategory.categoryId },
      });

      if (existingSubCategory) {
        throw new AppError('Subcategory with this title already exists in this category', HTTP_STATUS.CONFLICT);
      }
    }

    // Update subcategory
    const updatedSubCategory = await subCategoryRepository.update(id, {
      ...(title && { title }),
      ...(categoryId && { categoryId }),
      ...(typeof activeFlag === 'boolean' && { activeFlag }),
      updatedAt: new Date(),
    });

    if (updatedSubCategory.affected === 0) {
      throw new AppError('Failed to update subcategory', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Get updated subcategory
    const updatedSubCategoryData = await subCategoryRepository.findOne({
      where: { id },
    });

    logger.info(`Subcategory updated: ${updatedSubCategoryData?.title}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subcategory updated successfully',
      data: {
        subCategory: updatedSubCategoryData,
      },
    });
  } catch (error) {
    logger.error('Error updating subcategory:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Delete subcategory
  async deleteSubCategory(req: Request, res: Response): Promise<void> {
    try {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const subCategoryRepository = dataSource.getRepository('SubCategory');
    const menuItemRepository = dataSource.getRepository('MenuItem');

    // Check if subcategory exists
    const subCategory = await subCategoryRepository.findOne({
      where: { id },
    });

    if (!subCategory) {
      throw new AppError('Subcategory not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if subcategory has menu items
    const menuItemCount = await menuItemRepository.count({
      where: { subCategoryId: id },
    });

    if (menuItemCount > 0) {
      throw new AppError('Cannot delete subcategory with existing menu items', HTTP_STATUS.BAD_REQUEST);
    }

    // Delete subcategory
    const result = await subCategoryRepository.delete(id);

    if (result.affected === 0) {
      throw new AppError('Failed to delete subcategory', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    logger.info(`Subcategory deleted: ${subCategory.title}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subcategory deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting subcategory:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Get subcategories by category ID
  async getSubCategoriesByCategory(req: Request, res: Response): Promise<void> {
    try {
    const { categoryId } = req.params;
    const { activeOnly = 'true' } = req.query;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const subCategoryRepository = dataSource.getRepository('SubCategory');
    const categoryRepository = dataSource.getRepository('Category');

    // Verify category exists
    const category = await categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }

    const whereCondition: any = { categoryId };
    if (activeOnly === 'true') {
      whereCondition.activeFlag = true;
    }

    const subCategories = await subCategoryRepository.find({
      where: whereCondition,
      order: {
        title: 'ASC',
      },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subcategories retrieved successfully',
      data: {
        category: {
          id: category.id,
          title: category.title,
        },
        subCategories,
        count: subCategories.length,
      },
    });
  } catch (error) {
    logger.error('Error retrieving subcategories:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Get subcategory statistics
  async getSubCategoryStatistics(req: Request, res: Response): Promise<void> {
    try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const subCategoryRepository = dataSource.getRepository('SubCategory');
    const menuItemRepository = dataSource.getRepository('MenuItem');

    const totalSubCategories = await subCategoryRepository.count();
    const activeSubCategories = await subCategoryRepository.count({ where: { activeFlag: true } });
    const inactiveSubCategories = await subCategoryRepository.count({ where: { activeFlag: false } });

    // Get subcategories with their menu item counts
    const subCategories = await subCategoryRepository.find({
      order: { title: 'ASC' },
    });

    const subCategoriesWithStats = await Promise.all(
      subCategories.map(async (subCategory) => {
        const menuItemCount = await menuItemRepository.count({
          where: { subCategoryId: subCategory.id },
        });

        return {
          ...subCategory,
          menuItemCount,
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Subcategory statistics retrieved successfully',
      data: {
        totalSubCategories,
        activeSubCategories,
        inactiveSubCategories,
        subCategories: subCategoriesWithStats,
      },
    });
  } catch (error) {
    logger.error('Error getting subcategory statistics:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }
}

export default new SubCategoryController(); 