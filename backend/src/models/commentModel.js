const pool = require('../config/db');

const COMMENT_COLUMNS = 'c.id, c.task_id, c.user_id, c.content, c.created_at';

const SELECT_WITH_AUTHOR = `
  SELECT ${COMMENT_COLUMNS},
         u.name       AS author_name,
         u.email      AS author_email,
         u.avatar_url AS author_avatar
  FROM comments c
  LEFT JOIN users u ON u.id = c.user_id
`;

async function findByIdWithAuthor(id) {
  const { rows } = await pool.query(`${SELECT_WITH_AUTHOR} WHERE c.id = $1`, [id]);
  return rows[0] || null;
}

async function create({ taskId, userId, content }) {
  const { rows } = await pool.query(
    `INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING id`,
    [taskId, userId, content]
  );
  return findByIdWithAuthor(rows[0].id);
}

async function findByTaskId(taskId, { limit = 100, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `${SELECT_WITH_AUTHOR}
     WHERE c.task_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [taskId, limit, offset]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, task_id, user_id, content, created_at FROM comments WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function remove(id) {
  await pool.query('DELETE FROM comments WHERE id = $1', [id]);
}

module.exports = { create, findByTaskId, findById, remove };
