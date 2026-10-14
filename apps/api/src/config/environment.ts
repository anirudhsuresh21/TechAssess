import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'techassess-super-secret-jwt-key-2026-xyz-abc',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: 300,
  isTest: process.env.NODE_ENV === 'test',
};
