import { Request, Response } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { AppError } from '../middlewares/errorHandler';
import db from '../config/db';
import logger from '../utils/logger';


class CategoryController {
  
  async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const categoryRepository = dataSource.getRepository('Category');
    
    const { activeOnly = 'true' } = req.query;
    const whereCondition = activeOnly === 'true' ? { activeFlag: true } : {};

    const categories = await categoryRepository.find({
      where: whereCondition,
      order: {
        title: 'ASC',
      },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.CATEGORIES_RETRIEVED,
      data: {
        categories,
        count: categories.length,
      },
    });
  } catch (error) {
    logger.error('Error retrieving categories:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Get category by ID
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const categoryRepository = dataSource.getRepository('Category');
    
    const category = await categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.CATEGORY_RETRIEVED,
      data: {
        category,
      },
    });
  } catch (error) {
    logger.error('Error retrieving category:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Create new category
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
    const { title } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const categoryRepository = dataSource.getRepository('Category');

    // Check if category with same title already exists
    const existingCategory = await categoryRepository.findOne({
      where: { title },
    });

    if (existingCategory) {
      throw new AppError('Category with this title already exists', HTTP_STATUS.CONFLICT);
    }

    // Create new category
    const category = categoryRepository.create({
      title,
      activeFlag: true,
    });

    const savedCategory = await categoryRepository.save(category);

    logger.info(`New category created: ${savedCategory.title}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.CATEGORY_CREATED,
      data: {
        category: savedCategory,
      },
    });
  } catch (error) {
    logger.error('Error creating category:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Update category
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
    const { id } = req.params;
    const { title, activeFlag } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const categoryRepository = dataSource.getRepository('Category');

    // Find category
    const category = await categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if new title conflicts with existing category
    if (title && title !== category.title) {
      const existingCategory = await categoryRepository.findOne({
        where: { title },
      });

      if (existingCategory) {
        throw new AppError('Category with this title already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Update category
    const updatedCategory = await categoryRepository.update(id, {
      ...(title && { title }),
      ...(typeof activeFlag === 'boolean' && { activeFlag }),
      updatedAt: new Date(),
    });

    if (updatedCategory.affected === 0) {
      throw new AppError('Failed to update category', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Get updated category
    const updatedCategoryData = await categoryRepository.findOne({
      where: { id },
    });

    logger.info(`Category updated: ${updatedCategoryData?.title}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.CATEGORY_UPDATED,
      data: {
        category: updatedCategoryData,
      },
    });
  } catch (error) {
    logger.error('Error updating category:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  } 
  // Delete category
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const categoryRepository = dataSource.getRepository('Category');
    const subCategoryRepository = dataSource.getRepository('SubCategory');
    const menuItemRepository = dataSource.getRepository('MenuItem');

    // Check if category exists
    const category = await categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if category has subcategories
    const subCategoryCount = await subCategoryRepository.count({
      where: { categoryId: id },
    });

    if (subCategoryCount > 0) {
      throw new AppError('Cannot delete category with existing subcategories', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if category has menu items
    const menuItemCount = await menuItemRepository.count({
      where: { categoryId: id },
    });

    if (menuItemCount > 0) {
      throw new AppError('Cannot delete category with existing menu items', HTTP_STATUS.BAD_REQUEST);
    }

    // Delete category
    const result = await categoryRepository.delete(id);

    if (result.affected === 0) {
      throw new AppError('Failed to delete category', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    logger.info(`Category deleted: ${category.title}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.CATEGORY_DELETED,
    });
    } catch (error) {
      logger.error('Error deleting category:', error);
      throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get category statistics
  async getCategoryStatistics(req: Request, res: Response): Promise<void> {
    try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const categoryRepository = dataSource.getRepository('Category');
    const subCategoryRepository = dataSource.getRepository('SubCategory');
    const menuItemRepository = dataSource.getRepository('MenuItem');

    const totalCategories = await categoryRepository.count();
    const activeCategories = await categoryRepository.count({ where: { activeFlag: true } });
    const inactiveCategories = await categoryRepository.count({ where: { activeFlag: false } });

    // Get categories with their subcategory and menu item counts
    const categories = await categoryRepository.find({
      order: { title: 'ASC' },
    });

    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const subCategoryCount = await subCategoryRepository.count({
          where: { categoryId: category.id },
        });

        const menuItemCount = await menuItemRepository.count({
          where: { categoryId: category.id },
        });

        return {
          ...category,
          subCategoryCount,
          menuItemCount,
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Category statistics retrieved successfully',
      data: {
        totalCategories,
        activeCategories,
        inactiveCategories,
        categories: categoriesWithStats,
      },
    });
  } catch (error) {
    logger.error('Error getting category statistics:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }
}

export default new CategoryController(); 