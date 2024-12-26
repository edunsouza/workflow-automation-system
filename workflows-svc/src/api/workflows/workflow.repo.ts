import {
  Workflow,
  WorkflowAction,
  WorkflowStatus,
  WorkflowTrigger
} from '../../models/workflow.js';

// TODO: check mongoose InferSchemaType to auto generate this
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

  async insertWorkflow(wf: WorkflowDB) {
    const { type, interval } = wf.trigger;
    const now = new Date();

    if (type === WorkflowTrigger.PERIODIC) {
      // todo: enforce a minimum interval time (ex: 5000)
      wf.trigger.next_run = new Date(now.getTime() + interval);
    }

    wf.actions = wf.actions.map((action, index) => ({
      ...action,
      action_id: index + 1
    }));

    wf.created_at = now;

    const { _id } = await Workflow.create(wf);
    return _id;
  }

  async getWorkflowById(workflow_id: string) {
    // todo: store query metrics
    const workflow = await Workflow.findOne({ workflow_id }).lean();

    return workflow as WorkflowDB;
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