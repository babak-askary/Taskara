const { tryGetIO } = require('../sockets/socketManager');

// Emit an event to a room. If socket.io hasn't started yet (boot / tests),
// silently no-op via tryGetIO; any actual emit failure surfaces as a real error.
function emit(room, event, data) {
  const io = tryGetIO();
  if (!io) return;
  try {
    io.to(room).emit(event, data);
  } catch (err) {
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
