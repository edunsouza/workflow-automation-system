import { Worker } from '../shared/interfaces.js';
import { ExecutionActionDB, ActionStatus } from '../models/execution.js';
import { WorkflowActionDB, WorkflowAction } from '../models/workflow.js';

type ActionResult = ExecutionActionDB;

export class ActionWorker implements Worker<ActionResult> {
  constructor() { }

  async run(action: WorkflowActionDB): Promise<ActionResult> {
    switch (action.type) {
      case WorkflowAction.HTTP_REQUEST:
        return new HttpRequestAction().run(action);
      case WorkflowAction.LOG:
        return new LogAction().run(action);
    }
  }
}

class HttpRequestAction implements Worker<ActionResult> {
  async run({ action_id, method, url }: WorkflowActionDB): Promise<ActionResult> {
    const response = await fetch(url, { method }).catch(() => ({ status: 500, text: async () => '' }));
    const { status } = response;
    const content = await response.text().catch(e => String(e));

    return {
      action_id,
      status: status < 400 ? ActionStatus.OK : ActionStatus.FAILED,
      logs: `${url} [STATUS ${status}] => ${content.substring(0, 50)}`
    };
  }
}

class LogAction implements Worker<ActionResult> {
  async run({ action_id, message }: WorkflowActionDB): Promise<ActionResult> {
    return {
      action_id,
      status: ActionStatus.OK,
      logs: `stdout: ${message}`
    };
  }
}