import mongoose, { Connection } from 'mongoose';
import { logger } from './logger.js';

let connection: Connection;

export const connectDB = async () => {
  if (!connection) {
    const conn = await mongoose.connect(process.env.DATABASE_URL);
    connection = conn.connection;
    logger.info('DB connected');
  }

  return connection;
};

export const disconnectDB = async () => {
  await connection.close();
  logger.info('DB disconnected');
};