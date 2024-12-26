import dotenv from 'dotenv';
dotenv.config();

import { logger } from './shared/logger.js';
import { getConsumer, disconnectConsumer } from './shared/kafka.js';
import { connectDB, disconnectDB } from './shared/mongodb.js';
import { startProcessor } from './processor.js';
import app from './server.js';

const PORT = process.env.PORT || 8083;

const startServer = async () => {
  await getConsumer();
  await connectDB();
  startProcessor();

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
};

startServer();

['SIGTERM', 'SIGINT', 'SIGUSR2'].map(type => {
  process.once(type, async () => {
    try {
      logger.info('Server is shutting down');

      await disconnectConsumer();
      await disconnectDB();
    } finally {
      logger.info('Server shut down');
      process.exit(0);
    }
  });
});