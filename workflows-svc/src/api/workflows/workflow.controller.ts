import { Request, Response } from 'express';

import http from '../../shared/http.js';
import { BadRequestException } from '../../shared/exceptions.js';
import { logger } from '../../shared/logger.js';

import workflowService, { WorkflowCreate } from './workflow.service.js';

type Req<T> = Request<any, any, T>;

// todo: add schema validator (ajv / joi) for requests

export const createWorkflow = async (req: Req<WorkflowCreate>, res: Response) => {
  const workflow = req.body;

  try {
    await workflowService.createWorkflow(workflow);

    http.sendCreated(res, { workflowId: workflow.workflowId });
  } catch (error) {
    logger.error(`[Creation Error]: workflow id ${workflow.workflowId}`);
    logger.error(error);

    if (error instanceof BadRequestException) {
      http.sendBadRequest(res, error.message);
      return;
    }

    http.sendInternalError(res);
  }
};

export const triggerWorkflow = async (req: Request<{ id: string }>, res: Response) => {
  const workflowId = req.params.id;

  try {
    const { status } = await workflowService.triggerWorkflow(workflowId);

    http.sendSuccess(res, { status });
  } catch (error) {
    logger.error(`[Trigger Error]: workflow id ${workflowId}`);
    logger.error(error);

    if (error instanceof BadRequestException) {
      http.sendBadRequest(res, error.message);
      return;
    }

    http.sendInternalError(res);
  }
};
