import { getConsumer, Message } from './shared/consumer.js';
import { safeParse } from './utils/json.js';
import executionConsumer, { EXECUTION_TOPIC } from './events/execution.consumer.js';

const stringifyMessage = (message: Message) => ({
  key: message.key.toString('utf-8'),
  value: safeParse(message.value.toString('utf-8'))
});

export const startProcessor = async () => {
  const consumer = await getConsumer();

  await consumer.subscribe({ topics: [EXECUTION_TOPIC] });

  consumer.run({
    eachMessage: async ({ message: raw, topic }) => {
      const { value } = stringifyMessage(raw);

      if (topic === EXECUTION_TOPIC) {
        await executionConsumer.handle(value);
      }
    }
  });
};