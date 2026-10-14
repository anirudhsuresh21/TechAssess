import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './environment';
import { logger } from '../utils/logger';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  let uri = config.mongodbUri;

  if (!uri) {
    logger.info('No MONGODB_URI provided. Initializing in-memory MongoDB instance for seamless local zero-dependency operation...');
    try {
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'techassess',
        },
      });
      uri = mongoMemoryServer.getUri();
      logger.info(`In-memory MongoDB started at: ${uri}`);
    } catch (err: any) {
      logger.error('Failed to start MongoMemoryServer', { error: err.message });
      throw err;
    }
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    logger.info(`Successfully connected to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}`);
  } catch (err: any) {
    if (!mongoMemoryServer && !config.isTest) {
      logger.warn(`Could not connect to external MongoDB at ${uri}. Falling back to in-memory MongoDB...`);
      try {
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'techassess',
          },
        });
        const fallbackUri = mongoMemoryServer.getUri();
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000,
          autoIndex: true,
        });
        logger.info(`Fallback in-memory MongoDB connected successfully at ${fallbackUri}`);
        return;
      } catch (fallbackErr: any) {
        logger.error('Fallback in-memory MongoDB failed', { error: fallbackErr.message });
        throw fallbackErr;
      }
    }
    logger.error('MongoDB connection error', { error: err.message });
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    logger.info('Disconnected from MongoDB');
  } catch (err: any) {
    logger.error('Error disconnecting from MongoDB', { error: err.message });
  }
}
