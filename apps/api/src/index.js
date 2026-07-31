import express from 'express';
import { createHealthCheck } from '@circulos/shared';
import { createUserService } from './users.cjs';

const app = express();
const port = process.env.PORT || 3000;
const userService = createUserService();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json(createHealthCheck('api'));
});

app.post('/api/v1/users/register', (req, res) => {
  try {
    const created = userService.registerUser(req.body || {});
    res.status(201).json({ data: created });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/users/login', (req, res) => {
  try {
    const auth = userService.loginUser(req.body || {});
    res.json({ data: auth });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/v1/users', (_req, res) => {
  res.json({ data: userService.listUsers() });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
