import { EntitySchema } from 'typeorm';
import { USER_ROLES } from '../utils/constants';
import { IUser, UserRole } from '../types';

export class User implements IUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  role: UserRole;
  isActive: boolean | false;
  isEmailVerified: boolean | false;
  isMobileVerified: boolean | false;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  profilePicture?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export default new EntitySchema({
  name: 'User',
  target: User,
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    firstName: {
      type: 'string',
      nullable: false
    },
    lastName: {
      type: 'string',
      nullable: false
    },
    email: {
      type: 'string',
      unique: true,
      nullable: false
    },
    mobileNumber: {
      type: 'string',
      unique: true,
      nullable: false
    },
    password: {
      type: 'string',
      nullable: false
    },
    role: {
      type: 'string',
      default: 'user'
    },
    isActive: {
      type: 'boolean',
      default: true
    },
    isEmailVerified: {
      type: 'boolean',
      default: false
    },
    isMobileVerified: {
      type: 'boolean',
      default: false
    },
    emailVerificationToken: {
      type: 'string',
      nullable: true
    },
    emailVerificationExpires: {
      type: 'date',
      nullable: true
    },
    passwordResetToken: {
      type: 'string',
      nullable: true
    },
    passwordResetExpires: {
      type: 'date',
      nullable: true
    },
    lastLogin: {
      type: 'date',
      nullable: true
    },
    profilePicture: {
      type: 'string',
      nullable: true
    },
    address: {
      type: 'string',
      nullable: true
    },
    preferences: {
      type: 'string',
      nullable: true
    },
    createdAt: {
      type: 'date',
      default: () => new Date()
    },
    updatedAt: {
      type: 'date',
      default: () => new Date()
    }
  }
}); 