import { logger } from '../shared/logger.js';
import { Worker } from '../shared/interfaces.js';
import { getExponentialBackoff } from '../utils/time.js';
import { WorkflowDB, WorkflowActionDB } from '../models/workflow.js';
import { ExecutionDB, ExecutionActionDB } from '../models/execution.js';
import { WorkflowRepo } from '../repository/workflow.js';
import { ExecutionRepo } from '../repository/execution.js';
import { ActionWorker } from './actions.js';

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
        logger.info('Retrying execution');
        await this.retryFlow(pending, workflow);
      } else {
        logger.info('First execution attempt');
        await this.firstAttemptFlow(workflow);
      }

    } catch (e) {
      logger.error(`Error running workflow ${workflowId} - ${e}`);
    } finally {
      await this.workflowRepo.unlock(workflowId);
    }
  }

  private async firstAttemptFlow(wf: WorkflowDB) {
    const { workflow_id, actions } = wf;

    const execution = await this.executionRepo.create(workflow_id, actions.length);

    const { failed, results } = await this.runActions(actions);

    await this.updateExecutionStatus({ failed, results, execution, wf });
  }

  private async retryFlow(execution: ExecutionDB, wf: WorkflowDB) {
    const { retries, last_failed_action } = execution;

    if (retries <= 0) {
      await this.executionRepo.setFailed(execution.id);
      logger.info(`Execution finished UNSUCCESSFULLY`);
      return;
    }

    const { failed, results } = await this.runActions(wf.actions, last_failed_action);

    await this.updateExecutionStatus({ failed, results, execution, wf });
  }

  private async updateExecutionStatus({ failed, results, execution, wf }: {
    failed: boolean;
    results: ExecutionActionDB[];
    execution: ExecutionDB;
    wf: WorkflowDB
  }) {
    const { id, workflow_id, retries } = execution;

    if (failed) {
      await this.executionRepo.trackFailure(id, results);
      const nextRun = getExponentialBackoff(retries);
      await this.workflowRepo.setNextRun(workflow_id, nextRun);

      logger.info(`Execution failed. Backoff set`);
      return;
    }

    await this.executionRepo.setComplete(id, results);

    if (wf.trigger?.interval) {
      const nextRun = Date.now() + wf.trigger.interval;
      await this.workflowRepo.setNextRun(workflow_id, nextRun);
    }

    logger.info(`Execution finished SUCCESSFULLY`);
  }

  private async runActions(actions: WorkflowActionDB[], resumeId?: number) {
    const runner = new ActionWorker();
    const output: { failed: boolean; results: ExecutionActionDB[] } = {
      failed: false,
      results: []
    };
    const batch = resumeId !== undefined
      ? actions.filter(({ action_id }) => action_id <= resumeId)
      : actions;


    for (let action of batch) {
      const { failed, result } = await runner.run(action);
      output.results.push(result);

      if (failed) {
        output.failed = true;
        break;
      }
    }

    return output;
  }
}
