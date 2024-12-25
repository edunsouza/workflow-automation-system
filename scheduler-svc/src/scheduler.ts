import { logger } from './shared/logger.js';

import triggerWorkflowJob from './jobs/trigger-workflow.js';

export interface SchedulerRef extends NodeJS.Timeout { }

const SCHEDULER_INTERVAL = 5000;

export const startScheduler = () => {
  const ref = setInterval(runJobs, SCHEDULER_INTERVAL);
  logger.info('Scheduler started');
  return ref;
};

export const stopScheduler = (ref: SchedulerRef) => {
  clearInterval(ref);
  logger.info('Scheduler stopped');
};

const runJobs = () => {
  logger.info('Scheduler running');
  triggerWorkflowJob.run();
};