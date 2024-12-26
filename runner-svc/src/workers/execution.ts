import { logger } from '../shared/logger.js';
import { Worker } from '../shared/interfaces.js';
import { getExponentialBackoff } from '../utils/time.js';
import { WorkflowDB, WorkflowActionDB, WorkflowTrigger } from '../models/workflow.js';
import { ExecutionDB, ExecutionActionDB, ExecutionStatus, ActionStatus } from '../models/execution.js';
import { WorkflowRepo } from '../repository/workflow.js';
import { ExecutionRepo } from '../repository/execution.js';
import { ActionWorker } from './actions.js';

type ExecutionResults = {
  failed: boolean;
  results: ExecutionActionDB[];
};

export class ExecutionWorker implements Worker {
  private workflowRepo: WorkflowRepo = null;
  private executionRepo: ExecutionRepo = null;

  constructor(workflowRepo: WorkflowRepo, executionRepo: ExecutionRepo) {
    this.workflowRepo = workflowRepo;
    this.executionRepo = executionRepo;
  }

  async run(workflowId: string) {
    const workflow = await this.workflowRepo.getScheduled(workflowId);
    if (!workflow) return;

    try {
      await this.workflowRepo.lock(workflowId);
      const pending = await this.executionRepo.getPending(workflowId);

      if (pending) {
        await this.retryFlow(pending, workflow);
      } else {
        await this.freshFlow(workflow);
      }

    } catch (e) {
      logger.error(`Error running workflow ${workflowId} - ${e}`);
    } finally {
      await this.workflowRepo.unlock(workflowId);
    }
  }

  private async freshFlow(wf: WorkflowDB) {
    logger.info('Fresh execution');
    const { workflow_id, actions } = wf;

    const execution = await this.executionRepo.create(workflow_id, actions.length);
    const result = await this.runActions(actions);
    await this.onResults(execution, wf, result);
  }

  private async retryFlow(execution: ExecutionDB, wf: WorkflowDB) {
    logger.info('Retry execution');
    const { last_failed_action } = execution;

    const result = await this.runActions(wf.actions, last_failed_action);
    await this.onResults(execution, wf, result);
  }

  private async onResults(execution: ExecutionDB, wf: WorkflowDB, result: ExecutionResults) {
    const { failed, results } = result;
    const isFailed = failed && execution.retries === 1;
    const needsRetry = failed && execution.retries > 1;
    let status: ExecutionStatus = null;

    if (isFailed) {
      status = ExecutionStatus.FAILED;
      await this.setFailed(execution);
    } else if (needsRetry) {
      status = ExecutionStatus.PENDING;
      await this.setPending(execution, results);
    } else {
      status = ExecutionStatus.OK;
      await this.setComplete(execution, results);
    }

    await this.scheduleNext(execution, wf, status);
  }

  private async setComplete(execution: ExecutionDB, results: ExecutionActionDB[]) {
    await this.executionRepo.setComplete(execution.id, results);
    logger.info(`Execution finished SUCCESSFULLY`);
  }

  private async setPending(execution: ExecutionDB, results: ExecutionActionDB[]) {
    await this.executionRepo.trackFailure(execution.id, results);
    logger.info(`Execution failed. Backoff set`);
  }

  private async setFailed(execution: ExecutionDB) {
    await this.executionRepo.setFailed(execution.id);
    logger.info(`Execution finished UNSUCCESSFULLY`);
  }

  private async scheduleNext(execution: ExecutionDB, wf: WorkflowDB, status: ExecutionStatus) {
    const { interval, type } = wf.trigger;
    const needsBackoff = status === ExecutionStatus.PENDING;
    const needsReschedule = type === WorkflowTrigger.PERIODIC && interval;

    let nextRun = null;
    if (needsBackoff) {
      nextRun = getExponentialBackoff(execution.retries);
    } else if (needsReschedule) {
      nextRun = Date.now() + interval;
    }

    await this.workflowRepo.setNextRun(wf.workflow_id, nextRun);
  }

  private async runActions(actions: WorkflowActionDB[], resumeId?: number): Promise<ExecutionResults> {
    const runner = new ActionWorker();
    const output: ExecutionResults = {
      failed: false,
      results: []
    };
    const batch = resumeId !== undefined
      ? actions.filter(({ action_id }) => action_id <= resumeId)
      : actions;


    for (let action of batch) {
      const result = await runner.run(action);
      output.results.push(result);

      if (result.status === ActionStatus.FAILED) {
        output.failed = true;
        break;
      }
    }

    return output;
  }
}
