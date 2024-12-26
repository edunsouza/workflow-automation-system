import { logger } from '../shared/logger.js';
import {
  Execution,
  ExecutionDB,
  ExecutionStatus,
  ActionStatus,
  ExecutionActionDB
} from '../models/execution.js';

const DEFAULT_RETRIES = 4;

const logInfo = (message: string) => logger.info('[DB]: ' + message);

export class ExecutionRepo {
  constructor() { }

  async getPending(workflow_id: string): Promise<ExecutionDB> {
    const pending = await Execution.findOne({
      workflow_id,
      status: ExecutionStatus.PENDING
    }).lean();

    return pending;
  }

  async create(workflow_id: string, total_actions: number): Promise<ExecutionDB> {
    const execution = await Execution.create({
      workflow_id,
      status: ExecutionStatus.PENDING,
      retries: DEFAULT_RETRIES,
      last_failed_action: null,
      total_actions
    });

    logInfo(`Created execution ${execution.id}`);
    return execution;
  }

  async setComplete(id: string, actions: ExecutionActionDB[]) {
    await Execution.updateOne({ id }, {
      $set: {
        status: ExecutionStatus.OK,
        finished_at: Date.now(),
        last_failed_action: null,
        executed_actions: actions
      }
    });

    logInfo(`Completed execution ${id}`);
  }

  async trackFailure(id: string, actions: ExecutionActionDB[]) {
    const failedAction = actions.find(({ status }) => status === ActionStatus.FAILED);

    await Execution.updateOne({ id }, {
      $inc: { retries: -1 },
      $addToSet: { executed_actions: actions },
      last_failed_action: failedAction.action_id || 0,
    });

    logInfo(`Tracking failed execution attempt for workflow ${id}`);
  }

  async setFailed(id: string) {
    await Execution.updateOne({ id }, {
      $set: {
        status: ExecutionStatus.FAILED,
        finished_at: Date.now(),
        retries: 0
      }
    });

    logInfo(`Failed execution ${id}`);
  }
}

const executionRepo = new ExecutionRepo();
export default executionRepo;