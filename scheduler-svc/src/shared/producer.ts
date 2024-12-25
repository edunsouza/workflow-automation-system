import { getProducer as getKafkaProducer } from '../shared/kafka.js';

type Record = {
  topic: string;
  messages: {
    key?: Buffer | string | null;
    value: Buffer | string | null;
  }[];
};

interface Producer {
  send: (record: Record) => void;
};

let producer: Producer = null;

export const getProducer = async (): Promise<Producer> => {
  if (!producer) {
    producer = await getKafkaProducer() as Producer;
  }

  return producer;
};
