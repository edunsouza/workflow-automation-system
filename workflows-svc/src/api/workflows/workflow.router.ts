import express from 'express';

import { createWorkflow, triggerWorkflow } from './workflow.controller.js';

const router = express.Router();

// todo: add middleware to store request metrics

router.post('/', createWorkflow);

router.post('/:id/trigger', triggerWorkflow);

// archive workflow
router.delete('/', (_, res) => { res.send('not implemented') });

export default router;