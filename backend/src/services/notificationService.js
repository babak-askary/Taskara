const { getIO } = require('../sockets/socketManager');

// Safely emit an event — swallow errors if socket.io isn't ready.
function emit(room, event, data) {
  try {
    getIO().to(room).emit(event, data);
  } catch (err) {
    // Socket not initialized (e.g., during tests) — skip silently
  }
}

// A task was updated — notify everyone in the task's room.
function notifyTaskUpdate(task) {
  emit(`task:${task.id}`, 'task:updated', task);
}

// A new comment was posted — notify everyone in the task's room.
function notifyNewComment(taskId, comment) {
  emit(`task:${taskId}`, 'task:comment', { task_id: taskId, comment });
}

// A task was shared with a user — notify them directly.
function notifyTaskShared(userId, task) {
  emit(`user:${userId}`, 'task:shared', task);
}

// A task was deleted — notify everyone in the task's room so they can refresh.
function notifyTaskDeleted(taskId) {
  emit(`task:${taskId}`, 'task:deleted', { task_id: taskId });
}

// A user was unshared — notify them.
function notifyTaskUnshared(userId, taskId) {
  emit(`user:${userId}`, 'task:unshared', { task_id: taskId });
}

module.exports = {
  notifyTaskUpdate,
  notifyNewComment,
  notifyTaskShared,
  notifyTaskDeleted,
  notifyTaskUnshared,
};
