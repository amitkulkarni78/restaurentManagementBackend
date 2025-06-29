import { Request, Response } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { AppError } from '../middlewares/errorHandler';
import db from '../config/db';
import logger from '../utils/logger';
import { IMenuItem } from '../models/MenuItem';

class MenuItemController {
  // Get all menu items
  async getAllMenuItems(req: Request, res: Response): Promise<void> {
    try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError(ERROR_MESSAGES.DATABASE_NOT_CONNECTED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const menuItemRepository = dataSource.getRepository('MenuItem');
    
    const { 
      categoryId, 
      subCategoryId, 
      activeOnly = 'true',
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const whereCondition: any = {};
    
    if (activeOnly === 'true') {
      whereCondition.activeFlag = true;
    }
    
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }
    
    if (subCategoryId) {
      whereCondition.subCategoryId = subCategoryId;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    let menuItems;
    let totalCount;

    if (search) {
      // Search by title or description
      const searchRegex = new RegExp(search as string, 'i');
      menuItems = await menuItemRepository.find({
        where: {
          ...whereCondition,
          $or: [
            { title: searchRegex },
            { description: searchRegex }
          ]
        },
        skip,
        take: parseInt(limit as string),
        order: {
          title: 'ASC',
        },
      });

      totalCount = await menuItemRepository.count({
        where: {
          ...whereCondition,
          $or: [
            { title: searchRegex },
            { description: searchRegex }
          ]
        },
      });
    } else {
      menuItems = await menuItemRepository.find({
        where: whereCondition,
        skip,
        take: parseInt(limit as string),
        order: {
          title: 'ASC',
        },
      });

      totalCount = await menuItemRepository.count({
        where: whereCondition,
      });
    }

    const totalPages = Math.ceil(totalCount / parseInt(limit as string));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.MENU_ITEMS_RETRIEVED,
      data: {
        menuItems,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount,
          totalPages,
        },
      },
    });
  } catch (error) {
    logger.error('Error retrieving menu items:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Get menu item by ID
  async getMenuItemById(req: Request, res: Response): Promise<void> {
    try {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError(ERROR_MESSAGES.DATABASE_NOT_CONNECTED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const menuItemRepository = dataSource.getRepository('MenuItem');
    
    const menuItem = await menuItemRepository.findOne({
      where: { id },
    });

    if (!menuItem) {
      throw new AppError(ERROR_MESSAGES.MENU_ITEM_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.MENU_ITEM_RETRIEVED,
      data: {
        menuItem,
      },
    });
  } catch (error) {
    logger.error('Error retrieving menu item:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Create new menu item
  async createMenuItem(req: Request, res: Response): Promise<void> {
    try {
    const { 
      title, 
      description, 
      calories, 
      price, 
      ingredients, 
      categoryId, 
      subCategoryId 
    } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError(ERROR_MESSAGES.DATABASE_NOT_CONNECTED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const menuItemRepository = dataSource.getRepository('MenuItem');
    const categoryRepository = dataSource.getRepository('Category');
    const subCategoryRepository = dataSource.getRepository('SubCategory');

    // Verify category exists
    const category = await categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError(ERROR_MESSAGES.CATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (!category.activeFlag) {
      throw new AppError(ERROR_MESSAGES.CATEGORY_NOT_ACTIVE, HTTP_STATUS.BAD_REQUEST);
    }

    // Verify subcategory exists if provided
    if (subCategoryId) {
      const subCategory = await subCategoryRepository.findOne({
        where: { id: subCategoryId },
      });

      if (!subCategory) {
        throw new AppError(ERROR_MESSAGES.SUBCATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      if (!subCategory.activeFlag) {
        throw new AppError(ERROR_MESSAGES.SUBCATEGORY_NOT_ACTIVE, HTTP_STATUS.BAD_REQUEST);
      }

      if (subCategory.categoryId !== categoryId) {
        throw new AppError(ERROR_MESSAGES.SUBCATEGORY_NOT_BELONG_TO_CATEGORY, HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Check if menu item with same title already exists
    const existingMenuItem = await menuItemRepository.findOne({
      where: { title },
    });

    if (existingMenuItem) {
      throw new AppError(ERROR_MESSAGES.MENU_ITEM_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }

    // Create new menu item
    const menuItem = menuItemRepository.create({
      title,
      description,
      calories: parseInt(calories),
      price: parseFloat(price),
      ingredients: ingredients || [],
      pictureLinks: [],
      categoryId,
      subCategoryId,
      activeFlag: true,
    });

    const savedMenuItem = await menuItemRepository.save(menuItem);

    logger.info(`New menu item created: ${savedMenuItem.title}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.MENU_ITEM_CREATED,
      data: {
        menuItem: savedMenuItem,
      },
    });
  } catch (error) {
    logger.error('Error creating menu item:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Update menu item
  async updateMenuItem(req: Request, res: Response): Promise<void> {
    try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      calories, 
      price, 
      ingredients, 
      categoryId, 
      subCategoryId, 
      activeFlag 
    } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError(ERROR_MESSAGES.DATABASE_NOT_CONNECTED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const menuItemRepository = dataSource.getRepository('MenuItem');
    const categoryRepository = dataSource.getRepository('Category');
    const subCategoryRepository = dataSource.getRepository('SubCategory');

    // Find menu item
    const menuItem = await menuItemRepository.findOne({
      where: { id },
    });

    if (!menuItem) {
      throw new AppError(ERROR_MESSAGES.MENU_ITEM_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Verify category exists if changing
    if (categoryId && categoryId !== menuItem.categoryId) {
      const category = await categoryRepository.findOne({
        where: { id: categoryId },
      });

      if (!category) {
        throw new AppError(ERROR_MESSAGES.CATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      if (!category.activeFlag) {
        throw new AppError(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS, HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Verify subcategory exists if changing
    if (subCategoryId && subCategoryId !== menuItem.subCategoryId) {
      const subCategory = await subCategoryRepository.findOne({
        where: { id: subCategoryId },
      });

      if (!subCategory) {
        throw new AppError(ERROR_MESSAGES.SUBCATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      if (!subCategory.activeFlag) {
        throw new AppError(ERROR_MESSAGES.SUBCATEGORY_INACTIVE, HTTP_STATUS.BAD_REQUEST);
      }

      if (subCategory.categoryId !== (categoryId || menuItem.categoryId)) {
        throw new AppError(ERROR_MESSAGES.SUBCATEGORY_NOT_BELONG_TO_CATEGORY, HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Check if new title conflicts with existing menu item
    if (title && title !== menuItem.title) {
      const existingMenuItem = await menuItemRepository.findOne({
        where: { title },
      });

      if (existingMenuItem) {
        throw new AppError(ERROR_MESSAGES.MENU_ITEM_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
      }
    }

    // Update menu item
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (calories) updateData.calories = parseInt(calories);
    if (price) updateData.price = parseFloat(price);
    if (ingredients) updateData.ingredients = ingredients;
    if (categoryId) updateData.categoryId = categoryId;
    if (subCategoryId) updateData.subCategoryId = subCategoryId;
    if (typeof activeFlag === 'boolean') updateData.activeFlag = activeFlag;

    const updatedMenuItem = await menuItemRepository.update(id, updateData);

    if (updatedMenuItem.affected === 0) {
      throw new AppError(ERROR_MESSAGES.MENU_ITEM_NOT_UPDATED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Get updated menu item
    const updatedMenuItemData = await menuItemRepository.findOne({
      where: { id },
    });

    logger.info(`Menu item updated: ${updatedMenuItemData?.title}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.MENU_ITEM_UPDATED,
      data: {
        menuItem: updatedMenuItemData,
      },
    });
  } catch (error) {
    logger.error('Error updating menu item:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Delete menu item
  async deleteMenuItem(req: Request, res: Response): Promise<void> {
    try {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError(ERROR_MESSAGES.DATABASE_NOT_CONNECTED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const menuItemRepository = dataSource.getRepository('MenuItem');

    // Check if menu item exists
    const menuItem = await menuItemRepository.findOne({
      where: { id },
    });

    if (!menuItem) {
      throw new AppError(ERROR_MESSAGES.MENU_ITEM_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Delete menu item
    const result = await menuItemRepository.delete(id);

    if (result.affected === 0) {
      throw new AppError(ERROR_MESSAGES.MENU_ITEM_NOT_DELETED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    logger.info(`Menu item deleted: ${menuItem.title}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.MENU_ITEM_DELETED,
    });
  } catch (error) {
    logger.error('Error deleting menu item:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Upload images for menu item
  async uploadImages(req: Request, res: Response): Promise<void> {
    try {
    const { menuItemId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError(ERROR_MESSAGES.NO_IMAGES_PROVIDED, HTTP_STATUS.BAD_REQUEST);
    }

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError(ERROR_MESSAGES.DATABASE_NOT_CONNECTED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const menuItemRepository = dataSource.getRepository('MenuItem');

    // Check if menu item exists
    const menuItem = await menuItemRepository.findOne({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new AppError(ERROR_MESSAGES.MENU_ITEM_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // TODO: Implement S3 upload logic here
    // For now, we'll simulate the upload and store placeholder URLs
    const uploadedImages = files.map((file, index) => {
      const timestamp = Date.now();
      const fileName = `menu_${menuItemId}_${timestamp}_${index}.${file.originalname.split('.').pop()}`;
      
      // This would be the S3 URL in production
      return `https://s3.amazonaws.com/your-bucket/menu-images/${fileName}`;
    });

    // Update menu item with new image links
    const updatedPictureLinks = [...(menuItem.pictureLinks || []), ...uploadedImages];
    
    await menuItemRepository.update(menuItemId, {
      pictureLinks: updatedPictureLinks,
      updatedAt: new Date(),
    });

    logger.info(`Images uploaded for menu item: ${menuItem.title}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.IMAGES_UPLOADED_SUCCESSFULLY,
      data: {
        uploadedImages,
        totalImages: updatedPictureLinks.length,
      },
    });
  } catch (error) {
    logger.error('Error uploading images:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Remove image from menu item
  async removeImage(req: Request, res: Response): Promise<void> {
    try {
    const { menuItemId, imageUrl } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError(ERROR_MESSAGES.DATABASE_NOT_CONNECTED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const menuItemRepository = dataSource.getRepository('MenuItem');

    // Check if menu item exists
    const menuItem = await menuItemRepository.findOne({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new AppError(ERROR_MESSAGES.MENU_ITEM_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Remove image from pictureLinks array
    const updatedPictureLinks = (menuItem.pictureLinks || []).filter(
      (link) => link !== imageUrl
    );

    await menuItemRepository.update(menuItemId, {
      pictureLinks: updatedPictureLinks,
      updatedAt: new Date(),
    });

    // TODO: Delete from S3 here

    logger.info(`Image removed from menu item: ${menuItem.title}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.IMAGE_REMOVED_SUCCESSFULLY,
      data: {
        remainingImages: updatedPictureLinks.length,
      },
    });
  } catch (error) {
    logger.error('Error getting menu item statistics:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }

  // Get menu item statistics
  async getMenuItemStatistics(req: Request, res: Response): Promise<void> {
    try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError(ERROR_MESSAGES.DATABASE_NOT_CONNECTED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const menuItemRepository = dataSource.getRepository('MenuItem');

    const totalMenuItems = await menuItemRepository.count();
    const activeMenuItems = await menuItemRepository.count({ where: { activeFlag: true } });
    const inactiveMenuItems = await menuItemRepository.count({ where: { activeFlag: false } });

    // Get price statistics
    const menuItems = await menuItemRepository.find({
      select: ['price'],
    });

    const prices = menuItems.map(item => parseFloat(item.price as any));
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.MENU_ITEM_STATISTICS_RETRIEVED,
      data: {
        totalMenuItems,
        activeMenuItems,
        inactiveMenuItems,
        priceStats: {
          average: avgPrice.toFixed(2),
          minimum: minPrice.toFixed(2),
          maximum: maxPrice.toFixed(2),
        },
      },
      });
  } catch (error) {
        logger.error('Error getting menu item statistics:', error);
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  }
}

export default new MenuItemController(); 