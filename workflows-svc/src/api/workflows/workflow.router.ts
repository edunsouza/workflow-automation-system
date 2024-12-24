import express from 'express';

import { createWorkflow, triggerWorkflow } from './workflow.controller.js';

const router = express.Router();

// create workflow
router.post('/', createWorkflow);

// trigger workflow
router.post('/:id/trigger', triggerWorkflow);

// archive workflow
router.delete('/', (_, res) => { res.send('not implemented') });

export default router;