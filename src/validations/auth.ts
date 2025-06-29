import * as yup from 'yup';
import { Request, Response, NextFunction } from 'express';
import { USER_ROLES } from '../utils/constants';

// Type definitions for validation errors
interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResponse {
  success: false;
  error: {
    message: string;
    details: ValidationError[];
  };
}

// Signup validation schema
const signupSchema = yup.object().shape({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),

  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),

  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .lowercase(),

  mobileNumber: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10,15}$/, 'Please enter a valid mobile number'),

  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),

  role: yup
    .string()
    .oneOf(Object.values(USER_ROLES), 'Invalid role')
    .default(USER_ROLES.USER),
});

// Login validation schema
const loginSchema = yup.object().shape({
  emailOrMobile: yup
    .string()
    .required('Email or mobile number is required'),

  password: yup
    .string()
    .required('Password is required'),
});

// OTP request validation schema
const otpRequestSchema = yup.object().shape({
  mobileNumber: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10,15}$/, 'Please enter a valid mobile number'),
});

// OTP verification schema
const otpVerificationSchema = yup.object().shape({
  mobileNumber: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10,15}$/, 'Please enter a valid mobile number'),

  otp: yup
    .string()
    .required('OTP is required')
    .length(6, 'OTP must be exactly 6 digits')
    .matches(/^[0-9]{6}$/, 'OTP must contain only numbers'),
});

// Password reset request schema
const passwordResetRequestSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .lowercase(),
});

// Password reset schema
const passwordResetSchema = yup.object().shape({
  token: yup
    .string()
    .required('Reset token is required'),

  password: yup
    .string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

// Refresh token schema
const refreshTokenSchema = yup.object().shape({
  refreshToken: yup
    .string()
    .required('Refresh token is required'),
});

// Change password schema
const changePasswordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Current password is required'),

  newPassword: yup
    .string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .notOneOf([yup.ref('currentPassword')], 'New password must be different from current password'),

  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

// Update profile schema
const updateProfileSchema = yup.object().shape({
  firstName: yup
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),

  lastName: yup
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),

  mobileNumber: yup
    .string()
    .matches(/^[0-9]{10,15}$/, 'Please enter a valid mobile number'),

  address: yup.object().shape({
    street: yup.string().max(100, 'Street address cannot exceed 100 characters'),
    city: yup.string().max(50, 'City cannot exceed 50 characters'),
    state: yup.string().max(50, 'State cannot exceed 50 characters'),
    zipCode: yup.string().max(10, 'Zip code cannot exceed 10 characters'),
    country: yup.string().max(50, 'Country cannot exceed 50 characters'),
  }),

  preferences: yup.object().shape({
    notifications: yup.object().shape({
      email: yup.boolean(),
      sms: yup.boolean(),
      push: yup.boolean(),
    }),
    language: yup.string().oneOf(['en', 'es', 'fr'], 'Invalid language'),
    timezone: yup.string(),
  }),
});

// Validation middleware
const validate = (schema: yup.ObjectSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: ValidationError[] = error.inner.map(err => ({
          field: err.path || 'unknown',
          message: err.message,
        }));

        const response: ValidationResponse = {
          success: false,
          error: {
            message: 'Validation failed',
            details: errors,
          },
        };

        res.status(400).json(response);
      } else {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: [{ field: 'unknown', message: 'Unknown validation error' }],
          },
        });
      }
    }
  };
};

export {
  signupSchema,
  loginSchema,
  otpRequestSchema,
  otpVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  validate,
}; 