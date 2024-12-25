import { getProducer } from '../shared/producer.js';

const EXECUTION_TOPIC = 'workflow.execution';

export class WorkflowProducer {
  constructor() { }

  async emitExecutionRequest(workflowId: string) {
    const producer = await getProducer();

    producer.send({
      topic: EXECUTION_TOPIC,
      messages: [{
        key: workflowId,
        value: JSON.stringify({ workflowId }),
      }],
    });
  }
}

const workflowProducer = new WorkflowProducer();
export default workflowProducer;