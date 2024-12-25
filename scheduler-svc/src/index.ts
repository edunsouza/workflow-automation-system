import dotenv from 'dotenv';
dotenv.config();

import { logger } from './shared/logger.js';
import { getProducer, disconnectProducer } from './shared/kafka.js';
import { connectDB, disconnectDB } from './shared/mongodb.js';
import { startScheduler, stopScheduler, SchedulerRef } from './scheduler.js';
import app from './server.js';

const PORT = process.env.PORT || 8080;
let schedulerRef: SchedulerRef = null;

const startServer = async () => {
  await getProducer();
  await connectDB();
  schedulerRef = startScheduler();

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
};

startServer();

['SIGTERM', 'SIGINT', 'SIGUSR2'].map(type => {
  process.once(type, async () => {
    try {
      logger.info('Server is shutting down');

      stopScheduler(schedulerRef);
      await disconnectProducer();
      await disconnectDB();
    } finally {
      logger.info('Server shut down');
      process.exit(0);
    }
  });
});