import { logger } from '../shared/logger.js';
import {
  Workflow,
  WorkflowDB,
  WorkflowStatus
} from '../models/workflow.js';

const logInfo = (message: string) => logger.info('[DB]: ' + message);

export class WorkflowRepo {
  constructor() { }

  async getScheduled(id: string): Promise<WorkflowDB> {
    // todo: store query metrics
    const scheduled = await Workflow.findOne({
      workflow_id: id,
      status: WorkflowStatus.SCHEDULED
    }).lean();

    return scheduled;
  }

  async setNextRun(id: string, nextRun: number) {
    const next = new Date(nextRun);

    await Workflow.updateOne({ workflow_id: id }, {
      $set: { 'trigger.next_run': next }
    });

    logInfo(`Set workflow next_run to ${next.toLocaleString()}`);
  }

  async lock(id: string): Promise<void> {
    await Workflow.updateOne({ workflow_id: id }, {
      $set: { status: WorkflowStatus.LOCKED }
    });

    logInfo(`Workflow ${id} LOCKED`);
  }

  async unlock(id: string): Promise<void> {
    await Workflow.updateOne({ workflow_id: id }, {
      $set: { status: WorkflowStatus.ACTIVE }
    });

    logInfo(`Workflow ${id} UNLOCKED`);
  }
}

const workflowRepo = new WorkflowRepo();
export default workflowRepo;