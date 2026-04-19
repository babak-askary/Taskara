const pool = require('../config/db');

// Create a new task
async function create({
  title,
  description,
  status,
  priority,
  dueDate,
  categoryId,
  ownerId,
  isRecurring,
  recurrenceRule,
  estimatedTime,
}) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (
       title, description, status, priority, due_date,
       category_id, owner_id, is_recurring, recurrence_rule, estimated_time
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      title,
      description || null,
      status || 'todo',
      priority || 'medium',
      dueDate || null,
      categoryId || null,
      ownerId,
      isRecurring || false,
      recurrenceRule || null,
      estimatedTime || null,
    ]
  );
  return rows[0];
}

// Get a single task with owner + category info, plus access check
async function findById(id, userId) {
  const { rows } = await pool.query(
    `SELECT
       t.*,
       u.name  AS owner_name,
       u.email AS owner_email,
       c.name  AS category_name,
       c.color AS category_color,
       COALESCE(ts.permission, CASE WHEN t.owner_id = $2 THEN 'owner' ELSE NULL END) AS user_permission
     FROM tasks t
     LEFT JOIN users u      ON u.id = t.owner_id
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $2
     WHERE t.id = $1
       AND (t.owner_id = $2 OR ts.user_id = $2)`,
    [id, userId]
  );
  return rows[0] || null;
}

// List tasks owned by the user OR shared with them, with optional filters
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
  const conditions = ['(t.owner_id = $1 OR ts.user_id = $1)'];
  const values = [userId];
  let i = 2;

  if (status) {
    conditions.push(`t.status = $${i++}`);
    values.push(status);
  }
  if (priority) {
    conditions.push(`t.priority = $${i++}`);
    values.push(priority);
  }
  if (categoryId) {
    conditions.push(`t.category_id = $${i++}`);
    values.push(categoryId);
  }
  if (dueBefore) {
    conditions.push(`t.due_date <= $${i++}`);
    values.push(dueBefore);
  }
  if (dueAfter) {
    conditions.push(`t.due_date >= $${i++}`);
    values.push(dueAfter);
  }

  // Whitelist sort columns for safety
  const allowedSort = ['created_at', 'due_date', 'priority', 'status', 'title'];
  const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  values.push(limit, offset);
  const limitIdx = values.length - 1;

  const { rows } = await pool.query(
    `SELECT DISTINCT
       t.*,
       u.name  AS owner_name,
       c.name  AS category_name,
       c.color AS category_color
     FROM tasks t
     LEFT JOIN users u        ON u.id = t.owner_id
     LEFT JOIN categories c   ON c.id = t.category_id
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $1
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.${sortCol} ${sortDir}
     LIMIT $${limitIdx} OFFSET $${limitIdx + 1}`,
    values
  );
  return rows;
}

// Update allowed fields on a task
async function update(id, fields) {
  const allowed = [
    'title',
    'description',
    'status',
    'priority',
    'due_date',
    'category_id',
    'is_recurring',
    'recurrence_rule',
    'time_spent',
    'estimated_time',
  ];
  const sets = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      values.push(fields[key]);
    }
  }

  if (sets.length === 0) {
    // Nothing to update — return current
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return rows[0];
  }

  sets.push('updated_at = NOW()');
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0];
}

// Delete a task
async function remove(id) {
  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
}

// Check if user is the owner
async function isOwner(taskId, userId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM tasks WHERE id = $1 AND owner_id = $2',
    [taskId, userId]
  );
  return rows.length > 0;
}

// Check if user is owner OR has edit permission via task_shares
async function isOwnerOrEditor(taskId, userId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM tasks t
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $2
     WHERE t.id = $1 AND (t.owner_id = $2 OR ts.permission = 'edit')`,
    [taskId, userId]
  );
  return rows.length > 0;
}

// Check if user has any access (owner or shared view/edit)
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
  create,
  findById,
  findAll,
  update,
  remove,
  isOwner,
  isOwnerOrEditor,
  hasAccess,
};
