const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

const tasks = [];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function buildTask(input = {}) {
  const now = new Date().toISOString();

  return {
    id: generateId(),
    title: '',
    description: '',
    category: 'Work',
    status: 'todo',
    priority: 'medium',
    deadline: '',
    recurring: 'none',
    timeSpent: 0,
    comments: [],
    attachments: [],
    sharedWith: [],
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/tasks', (_req, res) => {
  res.json({ tasks });
});

app.post('/api/tasks', (req, res) => {
  const task = buildTask(req.body || {});

  if (!task.title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }

  tasks.unshift(task);
  return res.status(201).json({ task });
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'task not found' });
  }

  const updatedTask = {
    ...tasks[index],
    ...req.body,
    id,
    updatedAt: new Date().toISOString(),
  };

  tasks[index] = updatedTask;
  return res.json({ task: updatedTask });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'task not found' });
  }

  tasks.splice(index, 1);
  return res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Taskara backend listening on http://localhost:${port}`);
});
