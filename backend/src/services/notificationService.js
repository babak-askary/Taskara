const { getIO } = require('../sockets/socketManager');

// Emit an event to a room. Only swallows the "not initialized" case
// (happens during tests or before the HTTP server starts). All other
// errors are logged so we can actually debug them.
function emit(room, event, data) {
  try {
    getIO().to(room).emit(event, data);
  } catch (err) {
    if (err.message && err.message.includes('not initialized')) return;
    console.error('[notification] emit failed', { room, event, err: err.message });
  }
}

function notifyTaskUpdate(task) {
  emit(`task:${task.id}`, 'task:updated', task);
}

function notifyNewComment(taskId, comment) {
  emit(`task:${taskId}`, 'task:comment', { task_id: taskId, comment });
}

function notifyTaskShared(userId, task) {
  emit(`user:${userId}`, 'task:shared', task);
}

function notifyTaskDeleted(taskId) {
  emit(`task:${taskId}`, 'task:deleted', { task_id: taskId });
}

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
