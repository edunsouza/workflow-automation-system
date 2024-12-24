import dotenv from 'dotenv';
dotenv.config();

import { logger } from './shared/logger.js';
import { getProducer, disconnectProducer } from './shared/kafka.js';
import { connectDB, disconnectDB } from './shared/mongodb.js';
import app from './server.js';

const DEFAULT_PORT = 8080;

const startServer = async () => {
  await getProducer();
  await connectDB();

  const port = process.env.PORT || DEFAULT_PORT;
  app.listen(port, () => {
    logger.info(`server is running on port ${port}`);
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