import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import logger from '../utils/logger';
import { IJwtPayload, IRefreshTokenPayload } from '../types';

class JWTConfig {
  private secret: string;
  private refreshSecret: string;
  private expiresIn: string;
  private refreshExpiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  }

  generateToken(payload: IJwtPayload): string {
    try {
      const options: SignOptions = {
        expiresIn: this.expiresIn as any,
        issuer: 'restaurant-management-api',
        audience: 'restaurant-management-users',
      };
      return jwt.sign(payload, this.secret, options);
    } catch (error) {
      logger.error('Error generating JWT token:', error);
      throw new Error('Token generation failed');
    }
  }

  generateRefreshToken(payload: IRefreshTokenPayload): string {
    try {
      const options: SignOptions = {
        expiresIn: this.refreshExpiresIn as any,
        issuer: 'restaurant-management-api',
        audience: 'restaurant-management-users',
      };
      return jwt.sign(payload, this.refreshSecret, options);
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Refresh token generation failed');
    }
  }

  verifyToken(token: string): IJwtPayload {
    try {
      const options: VerifyOptions = {
        issuer: 'restaurant-management-api',
        audience: 'restaurant-management-users',
      };
      return jwt.verify(token, this.secret, options) as IJwtPayload;
    } catch (error) {
      logger.error('Token verification failed:', (error as Error).message);
      throw new Error('Invalid token');
    }
  }

  verifyRefreshToken(token: string): IRefreshTokenPayload {
    try {
      const options: VerifyOptions = {
        issuer: 'restaurant-management-api',
        audience: 'restaurant-management-users',
      };
      return jwt.verify(token, this.refreshSecret, options) as IRefreshTokenPayload;
    } catch (error) {
      logger.error('Refresh token verification failed:', (error as Error).message);
      throw new Error('Invalid refresh token');
    }
  }

  decodeToken(token: string): IJwtPayload | null {
    try {
      return jwt.decode(token) as IJwtPayload;
    } catch (error) {
      logger.error('Token decode failed:', error);
      throw new Error('Token decode failed');
    }
  }

  getTokenFromHeader(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header missing or invalid');
    }
    return authHeader.substring(7);
  }
}

export default new JWTConfig(); 