import { Kafka, Consumer } from 'kafkajs';
import { logger } from './logger.js';

let consumer: Consumer;

export const getConsumer = async (): Promise<Consumer> => {
  if (!consumer) {
    const kafka = new Kafka({
      clientId: 'runner-svc',
      brokers: [process.env.KAFKA_URL]
    });

    const newConsumer = kafka.consumer({ groupId: 'runner-svc-group' });
    await newConsumer.connect();

    consumer = newConsumer;
    logger.info('Consumer connected');
  }

  return consumer;
};

export const disconnectConsumer = async () => {
  await consumer.disconnect();
  logger.info('Consumer disconnected');
};
