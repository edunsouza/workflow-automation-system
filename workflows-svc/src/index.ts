import dotenv from 'dotenv';
dotenv.config();

import { logger } from './shared/logger.js';
import { getProducer, disconnectProducer } from './shared/kafka.js';
import { connectDB, disconnectDB } from './shared/mongodb.js';
import app from './server.js';

const PORT = process.env.PORT || 8081;

const startServer = async () => {
  await getProducer();
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`server is running on port ${PORT}`);
  });
};

startServer();

['SIGTERM', 'SIGINT', 'SIGUSR2'].map(type => {
  process.once(type, async () => {
    try {
      logger.info('Server is shutting down');
      await disconnectProducer();
      await disconnectDB();
    } finally {
      logger.info('Server shut down');
      process.exit(0);
    }
  });
});