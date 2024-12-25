import {
  Workflow,
  WorkflowAction,
  WorkflowStatus,
  WorkflowTrigger
} from '../models/workflow.js';

export type WorkflowDB = {
  workflow_id: string;
  status: WorkflowStatus;
  created_at?: Date;
  trigger: {
    type: WorkflowTrigger;
    interval?: number;
    next_run?: Date | string;
  };
  actions: {
    action_id?: number;
    type: WorkflowAction;
    url?: string;
    method?: string;
    message?: string;
  }[];
};

export class WorkflowRepo {
  constructor() { }

  async getScheduledWorkflows(): Promise<WorkflowDB[]> {
    // todo: store query metrics
    const now = new Date();

    const workflows = await Workflow.find({
      status: WorkflowStatus.ACTIVE,
      'trigger.next_run': { $lte: now }
    }).lean();

    return workflows as WorkflowDB[];
  }

  async updateWorkflowStatusToScheduled(workflow_id: string) {
    // todo: store query metrics
    const result = await Workflow.updateOne({ workflow_id }, {
      status: WorkflowStatus.SCHEDULED
    });

    return result.modifiedCount;
  }
}

const workflowRepo = new WorkflowRepo();
export default workflowRepo;