import { Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, USER_ROLES } from '../utils/constants';
import logger from '../utils/logger';
import db from '../config/db';
import { IAuthRequest, IUser, UserRole } from '../types';
import bcrypt from 'bcryptjs';

class UserController {
  // Get all users with pagination and filtering
  async getAllUsers(req: IAuthRequest, res: Response): Promise<void> {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Build query
    const whereClause: any = {};
    if (role) whereClause.role = role;

    let queryBuilder = userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder = queryBuilder.where(
        'user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search OR user.mobileNumber LIKE :search',
        { search: `%${search}%` }
      );
    }

    if (role) {
      queryBuilder = queryBuilder.andWhere('user.role = :role', { role });
    }

    const users = await queryBuilder
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.mobileNumber',
        'user.role',
        'user.isActive',
        'user.isEmailVerified',
        'user.isMobileVerified',
        'user.createdAt',
        'user.updatedAt'
      ])
      .skip(skip)
      .take(Number(limit))
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    const total = await queryBuilder.getCount();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }

  // Get user by ID
  async getUserById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const user = await userRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'mobileNumber',
        'role',
        'isActive',
        'isEmailVerified',
        'isMobileVerified',
        'profilePicture',
        'address',
        'preferences',
        'lastLogin',
        'createdAt',
        'updatedAt'
      ]
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user,
    });
  }

  // Create new user (Admin only)
  async createUser(req: Request, res: Response): Promise<void> {
    const { firstName, lastName, email, mobileNumber, password, role } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Check if user already exists
    let existingUser = await userRepository.findOne({
      where: { email }
    });

    if (!existingUser) {
      existingUser = await userRepository.findOne({
        where: { mobileNumber }
      });
    }

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError(ERROR_MESSAGES.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
      } else {
        throw new AppError(ERROR_MESSAGES.MOBILE_EXISTS, HTTP_STATUS.CONFLICT);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = userRepository.create({
      firstName,
      lastName,
      email,
      mobileNumber,
      password: hashedPassword,
      role: role || USER_ROLES.USER,
    });

    await userRepository.save(user);

    const userResponse = { ...user };
    delete (userResponse as any).password;

    logger.info(`New user created by admin: ${user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_CREATED,
      data: userResponse,
    });
  }

  // Update user
  async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const updateData = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Remove sensitive fields from update
    delete (updateData as any).password;
    delete (updateData as any).refreshToken;

    // Check if email/mobile already exists (if being updated)
    if (updateData.email && updateData.email !== user.email) {
      const emailExists = await userRepository.findOne({ where: { email: updateData.email } });
      if (emailExists) {
        throw new AppError(ERROR_MESSAGES.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
      }
    }

    if (updateData.mobileNumber && updateData.mobileNumber !== user.mobileNumber) {
      const mobileExists = await userRepository.findOne({ where: { mobileNumber: updateData.mobileNumber } });
      if (mobileExists) {
        throw new AppError(ERROR_MESSAGES.MOBILE_EXISTS, HTTP_STATUS.CONFLICT);
      }
    }

    Object.assign(user, updateData);
    const updatedUser = await userRepository.save(user);

    const userResponse = { ...updatedUser };
    delete (userResponse as any).password;

    logger.info(`User updated: ${updatedUser.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_UPDATED,
      data: userResponse,
    });
  }

  // Delete user (Admin only)
  async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    await userRepository.remove(user);

    logger.info(`User deleted: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_DELETED,
    });
  }

  // Activate user (Admin only)
  async activateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    user.isActive = true;
    const updatedUser = await userRepository.save(user);

    const userResponse = { ...updatedUser };
    delete (userResponse as any).password;

    logger.info(`User activated: ${updatedUser.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User activated successfully',
      data: userResponse,
    });
  }

  // Deactivate user (Admin only)
  async deactivateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    user.isActive = false;
    const updatedUser = await userRepository.save(user);

    const userResponse = { ...updatedUser };
    delete (userResponse as any).password;

    logger.info(`User deactivated: ${updatedUser.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User deactivated successfully',
      data: userResponse,
    });
  }

  // Change password
  async changePassword(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { currentPassword, newPassword } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const user = await userRepository.findOne({ where: { id: req.user.id } });
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await userRepository.save(user);

    logger.info(`Password changed for user: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully',
    });
  }

  // Get staff members
  async getStaffMembers(req: Request, res: Response): Promise<void> {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    // Get admin users
    const adminUsers = await userRepository.find({
      where: { role: USER_ROLES.ADMIN },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'mobileNumber',
        'role',
        'isActive',
        'lastLogin',
        'createdAt'
      ],
      order: {
        firstName: 'ASC'
      }
    });

    // Get staff users
    const staffUsers = await userRepository.find({
      where: { role: USER_ROLES.STAFF },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'mobileNumber',
        'role',
        'isActive',
        'lastLogin',
        'createdAt'
      ],
      order: {
        firstName: 'ASC'
      }
    });

    // Combine and sort results
    const staffMembers = [...adminUsers, ...staffUsers].sort((a, b) => {
      // Sort by role first (admin before staff), then by firstName
      if (a.role !== b.role) {
        return a.role === USER_ROLES.ADMIN ? -1 : 1;
      }
      return a.firstName.localeCompare(b.firstName);
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: staffMembers,
    });
  }

  // Upload profile picture
  async uploadProfilePicture(req: IAuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!req.file) {
      throw new AppError('No file uploaded', HTTP_STATUS.BAD_REQUEST);
    }

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Update profile picture path
    user.profilePicture = req.file.path;
    const updatedUser = await userRepository.save(user);

    const userResponse = { ...updatedUser };
    delete (userResponse as any).password;

    logger.info(`Profile picture uploaded for user: ${updatedUser.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: userResponse,
    });
  }

  // Get user statistics
  async getUserStatistics(req: IAuthRequest, res: Response): Promise<void> {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const [totalUsers, activeUsers, adminUsers, staffUsers, regularUsers] = await Promise.all([
      userRepository.count(),
      userRepository.count({ where: { isActive: true } }),
      userRepository.count({ where: { role: USER_ROLES.ADMIN } }),
      userRepository.count({ where: { role: USER_ROLES.STAFF } }),
      userRepository.count({ where: { role: USER_ROLES.USER } })
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        staffUsers,
        regularUsers,
        emailVerifiedUsers: 0, // TODO: Add this field to user entity
        mobileVerifiedUsers: 0, // TODO: Add this field to user entity
      },
    });
  }
}

export default new UserController(); 