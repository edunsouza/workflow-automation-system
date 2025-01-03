import { logger } from '../shared/logger.js';
import workflowRepo, { WorkflowRepo } from '../repository/workflow.js';
import workflowProducer, { WorkflowProducer } from '../events/workflow.producer.js';

const triggerWorkflow = async (repo: WorkflowRepo, producer: WorkflowProducer) => {
  // todo: paginate documents from repo + send to kafka in batches
  const workflows = await repo.getSchedulableWorkflows();

  if (!workflows.length) {
    // logger.info('There are no workflows to trigger right now');
    return;
  }

  logger.info(`Scheduling ${workflows.length} workflow(s)`);

  workflows.forEach(async ({ workflow_id }) => {
    await repo.scheduleWorkflow(workflow_id);
    producer.emitExecutionRequest(workflow_id);
  });

  logger.info(`Scheduled ${workflows.length} workflow(s)`);
};

export default {
  run: () => triggerWorkflow(workflowRepo, workflowProducer)
}