import { Worker } from '../shared/interfaces.js';
import { ExecutionActionDB, ActionStatus } from '../models/execution.js';
import { WorkflowActionDB } from '../models/workflow.js';

type ActionResult = {
  failed: boolean;
  result: ExecutionActionDB
};

export class ActionWorker implements Worker<ActionResult> {
  constructor() { }

  // TODO
  async run(action: WorkflowActionDB): Promise<ActionResult> {
    return {
      failed: true,
      result: {
        action_id: action.action_id,
        status: ActionStatus.FAILED,
        logs: 'faled :('
      }
    };
  }
}

class HttpRequestAction implements Worker {
  // TODO
  async run(): Promise<void> { }
}

class LogAction implements Worker {
  // TODO
  async run(): Promise<void> { }
}