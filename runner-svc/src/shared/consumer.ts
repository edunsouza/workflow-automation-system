import { getConsumer as getKafkaConsumer } from '../shared/kafka.js';

type Subscription = {
  topics: string[];
  fromBeginning?: boolean;
};

type Config = {
  eachMessage: (payload: Payload) => Promise<void>;
};

type Payload = {
  topic: string,
  message: Message
};

export type Message = {
  key: Buffer | null;
  value: Buffer | null;
};

interface Consumer {
  subscribe: (subscription: Subscription) => Promise<void>;
  run: (config: Config) => Promise<void>
};

let consumer: Consumer = null;

export const getConsumer = async (): Promise<Consumer> => {
  if (!consumer) {
    consumer = await getKafkaConsumer();
  }

  return consumer;
};
