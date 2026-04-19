const pool = require('../config/db');

// Create a new category for a user
async function create({ name, color, userId }) {
  const { rows } = await pool.query(
    `INSERT INTO categories (name, color, user_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, color || '#6366f1', userId]
  );
  return rows[0];
}

// Fetch all categories belonging to a user
async function findAllByUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC',
    [userId]
  );
  return rows;
}

// Fetch a single category
async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  return rows[0] || null;
}

// Update a category (name and color only)
async function update(id, { name, color }) {
  const sets = [];
  const values = [];
  let i = 1;

  if (name !== undefined) {
    sets.push(`name = $${i++}`);
    values.push(name);
  }
  if (color !== undefined) {
    sets.push(`color = $${i++}`);
    values.push(color);
  }

  if (sets.length === 0) return findById(id);

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE categories SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0];
}

// Delete a category (tasks with this category get category_id = NULL via ON DELETE SET NULL)
async function remove(id) {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}

module.exports = { create, findAllByUser, findById, update, remove };
