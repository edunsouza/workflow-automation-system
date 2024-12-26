import { BadRequestException } from '../../shared/exceptions.js';
import { logger, Logger } from '../../shared/logger.js';
import { intervalToMillis } from '../../utils/time.js';
import { WorkflowTrigger, WorkflowAction, WorkflowStatus } from '../../models/workflow.js';

import workflowRepo, { WorkflowRepo, WorkflowDB } from './workflow.repo.js';
import workflowEmitter, { WorkflowEmitter } from './workflow.emitter.js';

type Action = {
  type: WorkflowAction;
  url?: string;
  method?: string;
  message?: string;
};

export type WorkflowCreate = {
  workflowId: WorkflowDB['workflow_id'];
  trigger: {
    type: WorkflowTrigger;
    interval?: string;
  };
  actions: Action[];
};

export class WorkflowService {
  private repo: WorkflowRepo = null;
  private emitter: WorkflowEmitter = null;
  private logger: Logger = null;

  constructor(repo: WorkflowRepo, emitter: WorkflowEmitter, logger: Logger) {
    this.repo = repo;
    this.emitter = emitter;
    this.logger = logger;
  }

  private validateWorkflowId(id?: string | null) {
    if (!id) {
      throw new BadRequestException('Invalid workflow id');
    }
  }

  private validateTrigger(wf: WorkflowCreate) {
    if (!wf?.trigger) {
      throw new BadRequestException('Workflow requires trigger information');
    }

    const triggerOptions = Object.values(WorkflowTrigger);
    const isValidType = triggerOptions.includes(wf.trigger.type);
    if (!isValidType) {
      throw new BadRequestException(`Invalid trigger type. Options are: [${triggerOptions}]`);
    }

    const isPeriodic = wf.trigger.type === WorkflowTrigger.PERIODIC;
    if (isPeriodic && !wf.trigger.interval) {
      throw new BadRequestException('Periodic workflows require interval. Ex: 30s');
    }
  }

  private validateActions(wf: WorkflowCreate) {
    if (!wf.actions?.length) {
      throw new BadRequestException('Workflow must have actions');
    }

    wf.actions.forEach(action => {
      this.validateActionType(action);

      if (action.type === WorkflowAction.HTTP_REQUEST) {
        this.validateHttpRequestAction(action);
      }

      if (action.type === WorkflowAction.LOG) {
        this.validateLogAction(action);
      }
    });
  }

  private validateActionType(action: Action) {
    const isValidType = Object.values(WorkflowAction).includes(action?.type);
    if (!isValidType) {
      throw new BadRequestException(`Invalid workflow action ${action.type ?? '[empty]'}`);
    }
  }

  private validateHttpRequestAction(action: Action) {
    try {
      new URL(action.url);
    } catch (error) {
      throw new BadRequestException('Invalid URL for HTTP-REQUEST action');
    }

    const allowedMethods = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'];
    if (!allowedMethods.includes(action.method?.toUpperCase())) {
      throw new BadRequestException('Invalid METHOD for HTTP-REQUEST action');
    }
  }

  private validateLogAction(action: Action) {
    if (!action.message) {
      throw new BadRequestException('Missing MESSAGE for LOG action');
    }
  }

  private validateTriggerRequest(wf: WorkflowDB) {
    if (!wf) {
      throw new BadRequestException('Invalid workflow');
    }

    if (wf.trigger?.type === WorkflowTrigger.PERIODIC) {
      throw new BadRequestException('Periodic workflows cannot be triggered manually');
    }
  }

  private toWorkflowDB(wf: WorkflowCreate) {
    return {
      workflow_id: wf.workflowId,
      status: WorkflowStatus.ACTIVE,
      trigger: {
        type: wf.trigger.type,
        interval: wf.trigger.interval ? intervalToMillis(wf.trigger.interval) : null
      },
      actions: wf.actions
    };
  }

  async createWorkflow(wf: WorkflowCreate) {
    this.validateWorkflowId(wf?.workflowId);
    this.validateTrigger(wf);
    this.validateActions(wf);

    const workflowDB: WorkflowDB = this.toWorkflowDB(wf);
    const id = workflowDB.workflow_id;

    const duplicate = await this.repo.getWorkflowById(id);
    if (duplicate) {
      throw new BadRequestException(`Workflow "${id}" already created`);
    }

    await this.repo.insertWorkflow(workflowDB);

    this.logger.info(`Workflow ${workflowDB.workflow_id} created`);
  }

  async triggerWorkflow(id: string) {
    this.validateWorkflowId(id);
    const workflowDB = await this.repo.getWorkflowById(id);
    this.validateTriggerRequest(workflowDB);

    if (workflowDB.status !== WorkflowStatus.ACTIVE) {
      this.logger.info(`Skipping workflow ${id} (not active)`);
      return { status: 'workflow in progress' };
    }

    await this.repo.scheduleWorkflow(id);
    await this.emitter.emitExecutionRequest(id);

    this.logger.info(`Workflow ${id} triggered`);
    return { status: 'workflow triggered' };
  }
}

const workflowService = new WorkflowService(
  workflowRepo,
  workflowEmitter,
  logger
);

export default workflowService;