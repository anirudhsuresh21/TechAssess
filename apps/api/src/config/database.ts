import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './environment';
import { logger } from '../utils/logger';

let mongoMemoryServer: MongoMemoryServer | null = null;
let connectionPromise: Promise<void> | null = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const isProd = config.env === 'production';
    let uri = config.mongodbUri;

    if (!uri) {
      if (isServerless || isProd) {
        throw new Error(
          'MONGODB_URI environment variable is missing on Vercel. In-memory MongoDB cannot run in serverless. Please add your MongoDB Atlas connection string (MONGODB_URI) in your Vercel Project Settings.'
        );
      }
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
        autoIndex: !isProd,
      });
      logger.info(`Successfully connected to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}`);
    } catch (err: any) {
      if (!mongoMemoryServer && !config.isTest && !isServerless && !isProd) {
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
  })().catch((err) => {
    connectionPromise = null;
    throw err;
  });

  return connectionPromise;
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
