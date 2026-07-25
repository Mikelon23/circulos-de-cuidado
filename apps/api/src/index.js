import express from 'express';
import { createHealthCheck } from '@circulos/shared';

const app = express();
const port = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json(createHealthCheck('api'));
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
