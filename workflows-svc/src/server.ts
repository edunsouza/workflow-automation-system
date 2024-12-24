import express from 'express';
import cors from 'cors';

// import healthRouter from './api/health/health.router.js';
// import metricsRouter from './api/metrics/metrics.router.js';
import workflowsRouter from './api/workflows/workflow.router.js';
// import executionsRouter from './api/executions/executions.router.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(cors());

// app.use('/health', healthRouter);
// app.use('/metrics', metricsRouter);
app.use('/workflows', workflowsRouter);
// app.use('/v1/executions', executionsRouter);

app.get('*', (_, res) => {
  res.send('Not found');
});

export default app;