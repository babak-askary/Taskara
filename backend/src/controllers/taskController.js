const taskModel = require('../models/taskModel');
const { validateTaskInput } = require('../utils/validateTask');

// POST /api/tasks — create a new task
async function createTask(req, res, next) {
  try {
    const { valid, errors } = validateTaskInput(req.body);
    if (!valid) return res.status(400).json({ errors });

    const task = await taskModel.create({
      title: req.body.title.trim(),
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      dueDate: req.body.due_date,
      categoryId: req.body.category_id,
      ownerId: req.user.id,
      isRecurring: req.body.is_recurring,
      recurrenceRule: req.body.recurrence_rule,
      estimatedTime: req.body.estimated_time,
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks — list all tasks owned by or shared with the user
async function getAllTasks(req, res, next) {
  try {
    const {
      status,
      priority,
      category_id,
      due_before,
      due_after,
      sort_by,
      sort_order,
      limit,
      offset,
    } = req.query;

    const tasks = await taskModel.findAll({
      userId: req.user.id,
      status,
      priority,
      categoryId: category_id ? parseInt(category_id) : undefined,
      dueBefore: due_before,
      dueAfter: due_after,
      sortBy: sort_by,
      sortOrder: sort_order,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id — get a single task
async function getTaskById(req, res, next) {
  try {
    const task = await taskModel.findById(parseInt(req.params.id), req.user.id);
    if (!task) return res.status(404).json({ message: 'Task not found or no access' });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id — update a task (owner or editor only)
async function updateTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);

    const canEdit = await taskModel.isOwnerOrEditor(taskId, req.user.id);
    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit this task' });
    }

    const { valid, errors } = validateTaskInput(req.body, { partial: true });
    if (!valid) return res.status(400).json({ errors });

    const updated = await taskModel.update(taskId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id — only the owner can delete
async function deleteTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);

    const isOwner = await taskModel.isOwner(taskId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Only the owner can delete a task' });
    }

    await taskModel.remove(taskId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/search — TODO in Phase 7
async function searchTasks(req, res, next) {
  try {
    res.status(501).json({ message: 'Search not yet implemented (Phase 7)' });
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/comments — TODO in Phase 5
async function addComment(req, res, next) {
  try {
    res.status(501).json({ message: 'Comments not yet implemented (Phase 5)' });
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/attachments — TODO in Phase 10
async function addAttachment(req, res, next) {
  try {
    res.status(501).json({ message: 'Attachments not yet implemented (Phase 10)' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  searchTasks,
  addComment,
  addAttachment,
};
