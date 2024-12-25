import { Kafka, Producer } from 'kafkajs';
import { logger } from './logger.js';

let producer: Producer;

export const getProducer = async () => {
  if (!producer) {
    const kafka = new Kafka({
      clientId: 'scheduler-svc',
      brokers: [process.env.KAFKA_URL]
    });

    producer = kafka.producer();
    await producer.connect();
    logger.info('Producer connected');
  }

  return producer;
};

export const disconnectProducer = async () => {
  await producer.disconnect();
  logger.info('Producer disconnected');
};
