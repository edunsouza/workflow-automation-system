import {
  Workflow,
  WorkflowDB,
  WorkflowStatus
} from '../models/workflow.js';

export class WorkflowRepo {
  constructor() { }

  async getScheduledWorkflows(): Promise<WorkflowDB[]> {
    // todo: store query metrics
    const now = new Date();

    const workflows = await Workflow.find({
      status: WorkflowStatus.ACTIVE,
      'trigger.next_run': { $lte: now }
    }).lean();

    return workflows;
  }

  async scheduleWorkflow(workflow_id: string) {
    // todo: store query metrics
    const result = await Workflow.updateOne({ workflow_id }, {
      status: WorkflowStatus.SCHEDULED
    });

    return result.modifiedCount;
  }
}

const workflowRepo = new WorkflowRepo();
export default workflowRepo;