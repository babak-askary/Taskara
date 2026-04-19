const pool = require('../config/db');

// Create a comment on a task. Returns the comment with author info.
async function create({ taskId, userId, content }) {
  const { rows } = await pool.query(
    `WITH inserted AS (
       INSERT INTO comments (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *
     )
     SELECT i.*, u.name AS author_name, u.email AS author_email, u.avatar_url AS author_avatar
     FROM inserted i
     LEFT JOIN users u ON u.id = i.user_id`,
    [taskId, userId, content]
  );
  return rows[0];
}

// List all comments for a task, newest first, with author info
async function findByTaskId(taskId, { limit = 100, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT c.*, u.name AS author_name, u.email AS author_email, u.avatar_url AS author_avatar
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.task_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [taskId, limit, offset]
  );
  return rows;
}

// Fetch a single comment
async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM comments WHERE id = $1', [id]);
  return rows[0] || null;
}

// Delete a comment (controller enforces that only the author can)
async function remove(id) {
  await pool.query('DELETE FROM comments WHERE id = $1', [id]);
}

module.exports = { create, findByTaskId, findById, remove };
