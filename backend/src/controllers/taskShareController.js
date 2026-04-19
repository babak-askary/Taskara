const taskShareModel = require('../models/taskShareModel');
const taskModel = require('../models/taskModel');
const userModel = require('../models/userModel');
const notificationService = require('../services/notificationService');

const VALID_PERMISSIONS = ['view', 'edit'];

// POST /api/tasks/:id/share — share a task with another user (owner only)
async function shareTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    const { user_id: targetUserId, permission = 'view' } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ errors: ['user_id is required'] });
    }
    if (!VALID_PERMISSIONS.includes(permission)) {
      return res.status(400).json({ errors: [`permission must be one of: ${VALID_PERMISSIONS.join(', ')}`] });
    }

    // Only the owner can share
    const isOwner = await taskModel.isOwner(taskId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Only the task owner can share it' });
    }

    // Don't share with the owner
    if (parseInt(targetUserId) === req.user.id) {
      return res.status(400).json({ message: 'You cannot share a task with yourself' });
    }

    // Make sure the target user exists
    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const share = await taskShareModel.share({
      taskId,
      userId: parseInt(targetUserId),
      permission,
    });

    // Notify the target user that a task was shared with them
    const task = await taskModel.findById(taskId, req.user.id);
    notificationService.notifyTaskShared(parseInt(targetUserId), task);

    res.status(201).json(share);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id/share/:userId — remove a share (owner only)
async function unshareTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);

    const isOwner = await taskModel.isOwner(taskId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Only the task owner can remove shares' });
    }

    const removed = await taskShareModel.unshare(taskId, targetUserId);
    if (!removed) return res.status(404).json({ message: 'Share not found' });

    notificationService.notifyTaskUnshared(targetUserId, taskId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id/shares — list users a task is shared with (any member can view)
async function getSharedUsers(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);

    const hasAccess = await taskModel.hasAccess(taskId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have access to this task' });
    }

    const shares = await taskShareModel.findByTask(taskId);
    res.json(shares);
  } catch (err) {
    next(err);
  }
}

module.exports = { shareTask, unshareTask, getSharedUsers };
