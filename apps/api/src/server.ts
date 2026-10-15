import app from './app';
import { config } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      logger.info(`TechAssess API running on http://localhost:${config.port}`);
      logger.info(`Swagger docs available at http://localhost:${config.port}/api/docs`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// When running locally, start HTTP listener. When running on Vercel, export app handler.
if (!process.env.VERCEL) {
  startServer();
} else {
  // Connect database on cold start in serverless environment
  connectDatabase().catch((err) => {
    logger.error('Failed to connect to database in serverless init', { error: err.message });
  });
}

export default app;
export { app };
