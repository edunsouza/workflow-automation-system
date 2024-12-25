import { getProducer } from '../../shared/producer.js';

const EXECUTION_TOPIC = 'workflow.execution';

export class WorkflowEmitter {
  constructor() { }

  async emitExecutionRequest(workflowId: string) {
    const producer = await getProducer();

    producer.send({
      topic: EXECUTION_TOPIC,
      messages: [{
        key: workflowId,
        value: JSON.stringify({ workflow_id: workflowId }),
      }],
    });
  }
}

const workflowEmitter = new WorkflowEmitter();
export default workflowEmitter;