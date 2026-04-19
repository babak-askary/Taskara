const pool = require('../config/db');
const { buildUpdate, buildWhere } = require('../utils/sql');

// Columns the caller is allowed to set. Anything else in the input is ignored.
const CREATABLE = [
  'title', 'description', 'status', 'priority', 'due_date',
  'category_id', 'is_recurring', 'recurrence_rule', 'estimated_time',
];

const UPDATABLE = [
  'title', 'description', 'status', 'priority', 'due_date',
  'category_id', 'is_recurring', 'recurrence_rule', 'time_spent', 'estimated_time',
];

const SELECT_WITH_META = `
  SELECT DISTINCT t.*,
                  u.name  AS owner_name,
                  c.name  AS category_name,
                  c.color AS category_color
  FROM tasks t
  LEFT JOIN users u        ON u.id = t.owner_id
  LEFT JOIN categories c   ON c.id = t.category_id
  LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $1
`;

// Create a task. `fields` is an object with snake_case keys matching DB columns.
async function create(ownerId, fields) {
  const cols = ['owner_id'];
  const placeholders = ['$1'];
  const values = [ownerId];

  for (const col of CREATABLE) {
    if (fields[col] !== undefined) {
      values.push(fields[col]);
      cols.push(col);
      placeholders.push(`$${values.length}`);
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO tasks (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values
  );
  return rows[0];
}

// Get a single task with owner + category info. Enforces access (owner or shared).
async function findById(id, userId) {
  const { rows } = await pool.query(
    `SELECT t.*,
            u.name  AS owner_name,
            u.email AS owner_email,
            c.name  AS category_name,
            c.color AS category_color,
            COALESCE(ts.permission,
                     CASE WHEN t.owner_id = $2 THEN 'owner' ELSE NULL END) AS user_permission
     FROM tasks t
     LEFT JOIN users u        ON u.id = t.owner_id
     LEFT JOIN categories c   ON c.id = t.category_id
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $2
     WHERE t.id = $1 AND (t.owner_id = $2 OR ts.user_id = $2)`,
    [id, userId]
  );
  return rows[0] || null;
}

// List tasks the user owns or has been shared, with optional filters.
async function findAll({
  userId,
  status,
  priority,
  categoryId,
  dueBefore,
  dueAfter,
  sortBy = 'created_at',
  sortOrder = 'DESC',
  limit = 50,
  offset = 0,
}) {
  // The task_shares JOIN is parameterized with $1; start WHERE from $2.
  // We build conditions via the helper but the helper numbers from $1 — so offset by shifting values manually.
  // Simpler: just build the conditions manually here since we need the $1 slot for the JOIN.
  const conditions = ['(t.owner_id = $1 OR ts.user_id = $1)'];
  const values = [userId];

  const push = (sql, val) => {
    values.push(val);
    conditions.push(sql.replace('?', `$${values.length}`));
  };

  if (status)     push('t.status = ?', status);
  if (priority)   push('t.priority = ?', priority);
  if (categoryId) push('t.category_id = ?', categoryId);
  if (dueBefore)  push('t.due_date <= ?', dueBefore);
  if (dueAfter)   push('t.due_date >= ?', dueAfter);

  // Whitelist sort columns — prevents SQL injection via ORDER BY
  const allowedSort = ['created_at', 'due_date', 'priority', 'status', 'title'];
  const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  values.push(limit, offset);
  const { rows } = await pool.query(
    `${SELECT_WITH_META}
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.${sortCol} ${sortDir}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows;
}

// Full-text search across the user's tasks. Uses the generated tsvector column.
async function search({ query, userId, status, priority, categoryId, limit = 50, offset = 0 }) {
  const conditions = ['(t.owner_id = $1 OR ts.user_id = $1)'];
  const values = [userId];
  let rankSelect = '0 AS rank';

  const push = (sql, val) => {
    values.push(val);
    conditions.push(sql.replace('?', `$${values.length}`));
  };

  if (query && query.trim()) {
    values.push(query.trim());
    const idx = values.length;
    conditions.push(`t.search_vector @@ plainto_tsquery('english', $${idx})`);
    rankSelect = `ts_rank(t.search_vector, plainto_tsquery('english', $${idx})) AS rank`;
  }

  if (status)     push('t.status = ?', status);
  if (priority)   push('t.priority = ?', priority);
  if (categoryId) push('t.category_id = ?', categoryId);

  values.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT DISTINCT t.*,
            u.name  AS owner_name,
            c.name  AS category_name,
            c.color AS category_color,
            ${rankSelect}
     FROM tasks t
     LEFT JOIN users u        ON u.id = t.owner_id
     LEFT JOIN categories c   ON c.id = t.category_id
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $1
     WHERE ${conditions.join(' AND ')}
     ORDER BY rank DESC, t.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows;
}

async function update(id, fields) {
  const q = buildUpdate('tasks', id, fields, UPDATABLE);
  if (!q) {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return rows[0];
  }
  const { rows } = await pool.query(q.text, q.values);
  return rows[0];
}

async function remove(id) {
  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
}

async function isOwner(taskId, userId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM tasks WHERE id = $1 AND owner_id = $2',
    [taskId, userId]
  );
  return rows.length > 0;
}

async function isOwnerOrEditor(taskId, userId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM tasks t
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $2
     WHERE t.id = $1 AND (t.owner_id = $2 OR ts.permission = 'edit')`,
    [taskId, userId]
  );
  return rows.length > 0;
}

async function hasAccess(taskId, userId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM tasks t
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $2
     WHERE t.id = $1 AND (t.owner_id = $2 OR ts.user_id = $2)`,
    [taskId, userId]
  );
  return rows.length > 0;
}

module.exports = {
  create, findById, findAll, update, remove, search,
  isOwner, isOwnerOrEditor, hasAccess,
};
