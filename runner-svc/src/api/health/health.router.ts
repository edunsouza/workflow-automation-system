import express from 'express';

import { check } from './health.controller.js';

const router = express.Router();

router.get('/', check);

export default router;