import express from 'express';
import cors from 'cors';

import healthRouter from './api/health/health.router.js';

const app = express();

app.use(cors());

app.use('/health', healthRouter);

app.get('*', (_, res) => {
  res.send('Not found');
});

export default app;