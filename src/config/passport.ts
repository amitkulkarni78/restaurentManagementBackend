import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { IUser, UserRole } from '../types';
import jwtConfig from './jwt';
import logger from '../utils/logger';
import db from './db';

// User lookup functions using database connection
const getUserById = async (id: string): Promise<IUser | null> => {
  try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      logger.error('Database not connected in passport getUserById');
      return null;
    }

    const userRepository = dataSource.getRepository('User');
    const user = await userRepository.findOne({ where: { id } });
    
    if (!user) {
      return null;
    }

    // Remove sensitive data
    const userResponse = { ...user };
    delete (userResponse as any).password;
    delete (userResponse as any).refreshToken;
    
    return userResponse as IUser;
  } catch (error) {
    logger.error('Error in getUserById:', error);
    return null;
  }
};

const getUserByEmail = async (email: string): Promise<IUser | null> => {
  try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      logger.error('Database not connected in passport getUserByEmail');
      return null;
    }

    const userRepository = dataSource.getRepository('User');
    const user = await userRepository.findOne({ where: { email } });
    
    if (!user) {
      return null;
    }

    // Remove sensitive data
    const userResponse = { ...user };
    delete (userResponse as any).password;
    delete (userResponse as any).refreshToken;
    
    return userResponse as IUser;
  } catch (error) {
    logger.error('Error in getUserByEmail:', error);
    return null;
  }
};

const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new Error('Database not connected in passport createUser');
    }

    const userRepository = dataSource.getRepository('User');
    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);
    
    // Remove sensitive data
    const userResponse = { ...savedUser };
    delete (userResponse as any).password;
    delete (userResponse as any).refreshToken;
    
    return userResponse as IUser;
  } catch (error) {
    logger.error('Error in createUser:', error);
    throw error;
  }
};

const updateUser = async (id: string, userData: Partial<IUser>): Promise<IUser | null> => {
  try {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      logger.error('Database not connected in passport updateUser');
      return null;
    }

    const userRepository = dataSource.getRepository('User');
    await userRepository.update(id, userData);
    const updatedUser = await userRepository.findOne({ where: { id } });
    
    if (!updatedUser) {
      return null;
    }

    // Remove sensitive data
    const userResponse = { ...updatedUser };
    delete (userResponse as any).password;
    delete (userResponse as any).refreshToken;
    
    return userResponse as IUser;
  } catch (error) {
    logger.error('Error in updateUser:', error);
    return null;
  }
};

// JWT Strategy
passport.use(
  new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'fallback-secret-key',
    issuer: 'restaurant-management-api',
    audience: 'restaurant-management-users',
  },
  async (payload: any, done: any) => {
    try {
      logger.info('JWT Strategy payload:', payload);
      const user = await getUserById(payload.userId);
      if (!user) {
        logger.warn('User not found for JWT payload:', payload);
        return done(null, false);
      }
      if (!user.isActive) {
        logger.warn('Inactive user attempted JWT authentication:', user.id);
        return done(null, false, { message: 'Account is deactivated' });
      }
      logger.info('JWT authentication successful for user:', user.id);
      return done(null, user);
    } catch (error) {
      logger.error('JWT Strategy error:', error);
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/v1/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Check if user already exists
        let user = await getUserByEmail(profile.emails[0].value);

        if (!user) {
          // Create new user
          user = await createUser({
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profilePicture: profile.photos[0] ? profile.photos[0].value : undefined,
            isEmailVerified: true,
            isActive: true,
            role: UserRole.USER,
          });
          logger.info(`New user created via Google OAuth: ${user.email}`);
        } else {
          // Update existing user's OAuth info
          user = await updateUser(user.id!, {
            profilePicture: profile.photos[0] ? profile.photos[0].value : user.profilePicture,
          }) || user;
        }

        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth Strategy error:', error);
        return done(error, null);
      }
    })
  );
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: '/api/v1/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'picture'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Check if user already exists
        let user = await getUserByEmail(profile.emails[0].value);

        if (!user) {
          // Create new user
          user = await createUser({
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profilePicture: profile.photos[0] ? profile.photos[0].value : undefined,
            isEmailVerified: true,
            isActive: true,
            role: UserRole.USER,
          });
          logger.info(`New user created via Facebook OAuth: ${user.email}`);
        } else {
          // Update existing user's OAuth info
          user = await updateUser(user.id!, {
            profilePicture: profile.photos[0] ? profile.photos[0].value : user.profilePicture,
          }) || user;
        }

        return done(null, user);
      } catch (error) {
        logger.error('Facebook OAuth Strategy error:', error);
        return done(error, null);
      }
    })
  );
}

// Serialize user for session
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport; 