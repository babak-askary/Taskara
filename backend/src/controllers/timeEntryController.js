const timeEntryModel = require('../models/timeEntryModel');
const taskModel = require('../models/taskModel');
const notificationService = require('../services/notificationService');
const parseId = require('../utils/parseId');

const MAX_MANUAL_MINUTES = 24 * 60; // one day
const MIN_MANUAL_MINUTES = 1;

async function requireEditor(req, res, taskId) {
  const allowed = await taskModel.isOwnerOrEditor(taskId, req.user.id);
  if (!allowed) {
    res.status(403).json({ message: 'You need edit access to track time on this task.' });
    return false;
  }
  return true;
}

// GET /api/tasks/:id/time — list time entries + active timer (for current user)
async function listEntries(req, res, next) {
  try {
    const taskId = parseId(req.params.id);
    if (taskId === null) return res.status(400).json({ message: 'Invalid task id' });
    const hasAccess = await taskModel.hasAccess(taskId, req.user.id);
    if (!hasAccess) return res.status(403).json({ message: 'No access to this task.' });

    const [entries, active] = await Promise.all([
      timeEntryModel.listForTask(taskId),
      timeEntryModel.findActive(taskId, req.user.id),
    ]);
    res.json({ entries, active });
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/time/start
async function startTimer(req, res, next) {
  try {
    const taskId = parseId(req.params.id);
    if (taskId === null) return res.status(400).json({ message: 'Invalid task id' });
    if (!(await requireEditor(req, res, taskId))) return;

    const existing = await timeEntryModel.findActive(taskId, req.user.id);
    if (existing) return res.status(409).json({ message: 'A timer is already running.', active: existing });

    const entry = await timeEntryModel.startTimer(taskId, req.user.id);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/time/stop
async function stopTimer(req, res, next) {
  try {
    const taskId = parseId(req.params.id);
    if (taskId === null) return res.status(400).json({ message: 'Invalid task id' });
    if (!(await requireEditor(req, res, taskId))) return;

    const result = await timeEntryModel.stopTimer(taskId, req.user.id);
    if (!result) return res.status(404).json({ message: 'No active timer to stop.' });

    notificationService.notifyTaskUpdate(result.task);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/time/manual { minutes, note? }
async function addManual(req, res, next) {
  try {
    const taskId = parseId(req.params.id);
    if (taskId === null) return res.status(400).json({ message: 'Invalid task id' });
    if (!(await requireEditor(req, res, taskId))) return;

    const minutes = parseInt(req.body.minutes, 10);
    if (!Number.isFinite(minutes) || minutes < MIN_MANUAL_MINUTES || minutes > MAX_MANUAL_MINUTES) {
      return res.status(400).json({
        errors: [`minutes must be an integer between ${MIN_MANUAL_MINUTES} and ${MAX_MANUAL_MINUTES}`],
      });
    }
    const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 500) : null;

    const result = await timeEntryModel.addManual(taskId, req.user.id, minutes, note || null);
    notificationService.notifyTaskUpdate(result.task);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listEntries, startTimer, stopTimer, addManual };
