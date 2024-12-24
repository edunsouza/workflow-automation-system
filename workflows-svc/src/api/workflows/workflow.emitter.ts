import { getProducer } from '../../shared/kafka.js';

const EXECUTION_TOPIC = 'workflow.execution';

export class WorkflowEmitter {
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

const workflowService = new WorkflowEmitter();
export default workflowService;