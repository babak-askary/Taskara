const taskModel = require('../models/taskModel');
const commentModel = require('../models/commentModel');
const notificationService = require('../services/notificationService');

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

// Validate a task payload. Returns an array of error strings (empty = valid).
// `partial` skips checks for fields that weren't sent (used for PUT).
function validateTask(body, partial = false) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      errors.push('title is required');
    } else if (body.title.length > 255) {
      errors.push('title must be 255 chars or less');
    }
  }
  if (body.status && !STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }
  if (body.priority && !PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
  }
  if (body.due_date && isNaN(Date.parse(body.due_date))) {
    errors.push('due_date must be a valid date');
  }
  return errors;
}

async function createTask(req, res, next) {
  try {
    const errors = validateTask(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const task = await taskModel.create(req.user.id, {
      ...req.body,
      title: req.body.title.trim(),
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function getAllTasks(req, res, next) {
  try {
    const {
      status, priority, category_id, due_before, due_after,
      sort_by, sort_order, limit, offset,
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

async function getTaskById(req, res, next) {
  try {
    const task = await taskModel.findById(parseInt(req.params.id), req.user.id);
    if (!task) return res.status(404).json({ message: 'Task not found or no access' });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    const canEdit = await taskModel.isOwnerOrEditor(taskId, req.user.id);
    if (!canEdit) return res.status(403).json({ message: 'No permission to edit' });

    const errors = validateTask(req.body, true);
    if (errors.length) return res.status(400).json({ errors });

    const updated = await taskModel.update(taskId, req.body);
    notificationService.notifyTaskUpdate(updated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    if (!(await taskModel.isOwner(taskId, req.user.id))) {
      return res.status(403).json({ message: 'Only the owner can delete' });
    }
    await taskModel.remove(taskId);
    notificationService.notifyTaskDeleted(taskId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function searchTasks(req, res, next) {
  try {
    const { q, status, priority, category_id, limit, offset } = req.query;
    const tasks = await taskModel.search({
      query: q,
      userId: req.user.id,
      status,
      priority,
      categoryId: category_id ? parseInt(category_id) : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ errors: ['content required'] });
    }
    if (content.length > 5000) {
      return res.status(400).json({ errors: ['content must be 5000 chars or less'] });
    }

    if (!(await taskModel.hasAccess(taskId, req.user.id))) {
      return res.status(403).json({ message: 'No access to this task' });
    }

    const comment = await commentModel.create({
      taskId,
      userId: req.user.id,
      content: content.trim(),
    });
    notificationService.notifyNewComment(taskId, comment);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

async function getComments(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    if (!(await taskModel.hasAccess(taskId, req.user.id))) {
      return res.status(403).json({ message: 'No access to this task' });
    }
    const comments = await commentModel.findByTaskId(taskId, {
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
    });
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const commentId = parseInt(req.params.commentId);
    const comment = await commentModel.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the author can delete' });
    }
    await commentModel.remove(commentId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask, getAllTasks, getTaskById, updateTask, deleteTask,
  searchTasks, addComment, getComments, deleteComment,
};
