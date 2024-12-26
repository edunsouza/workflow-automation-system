import { logger } from '../shared/logger.js';
import { EventConsumer } from '../shared/interfaces.js';
import workflowRepo from '../repository/workflow.js';
import executionRepo from '../repository/execution.js';
import { ExecutionWorker } from '../workers/execution.js';

export const EXECUTION_TOPIC = 'workflow.execution';

type ExecutionEvent = {
  workflow_id: string
};

export class ExecutionConsumer implements EventConsumer {
  constructor() { }

  async handle(event: ExecutionEvent) {
    // this handler could route each event.kind to a specific handler method
    await this.onExecutionRequest(event);

    logger.info('Execution event consumed successfully');
  }

  private async onExecutionRequest({ workflow_id }: ExecutionEvent) {
    if (!workflow_id) {
      return;
    }

    logger.info(`Requesting execution for ${workflow_id}`);

    const worker = new ExecutionWorker(workflowRepo, executionRepo);
    await worker.run(workflow_id);
  }
}

const executionConsumer = new ExecutionConsumer();
export default executionConsumer;