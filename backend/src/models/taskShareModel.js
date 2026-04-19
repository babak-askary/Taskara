const pool = require('../config/db');

// Share a task with a user (or update existing permission)
async function share({ taskId, userId, permission = 'view' }) {
  const { rows } = await pool.query(
    `INSERT INTO task_shares (task_id, user_id, permission)
     VALUES ($1, $2, $3)
     ON CONFLICT (task_id, user_id) DO UPDATE SET permission = EXCLUDED.permission
     RETURNING *`,
    [taskId, userId, permission]
  );
  return rows[0];
}

// Remove a share
async function unshare(taskId, userId) {
  const { rows } = await pool.query(
    'DELETE FROM task_shares WHERE task_id = $1 AND user_id = $2 RETURNING *',
    [taskId, userId]
  );
  return rows[0] || null;
}

// List users a task is shared with, including their user info
async function findByTask(taskId) {
  const { rows } = await pool.query(
    `SELECT ts.*, u.name AS user_name, u.email AS user_email, u.avatar_url AS user_avatar
     FROM task_shares ts
     LEFT JOIN users u ON u.id = ts.user_id
     WHERE ts.task_id = $1
     ORDER BY ts.created_at ASC`,
    [taskId]
  );
  return rows;
}

// List tasks shared with a user (minimal — useful for "shared with me" views)
async function findByUser(userId) {
  const { rows } = await pool.query(
    `SELECT ts.*, t.title, t.status
     FROM task_shares ts
     LEFT JOIN tasks t ON t.id = ts.task_id
     WHERE ts.user_id = $1`,
    [userId]
  );
  return rows;
}

// Get a user's permission on a task (returns 'view', 'edit', or null)
async function getPermission(taskId, userId) {
  const { rows } = await pool.query(
    'SELECT permission FROM task_shares WHERE task_id = $1 AND user_id = $2',
    [taskId, userId]
  );
  return rows[0]?.permission || null;
}

module.exports = { share, unshare, findByTask, findByUser, getPermission };
