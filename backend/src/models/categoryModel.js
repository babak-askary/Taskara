const pool = require('../config/db');
const { buildUpdate } = require('../utils/sql');

const UPDATABLE = ['name', 'color'];

async function create({ name, color, userId }) {
  const { rows } = await pool.query(
    `INSERT INTO categories (name, color, user_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, color || '#6366f1', userId]
  );
  return rows[0];
}

async function findAllByUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC',
    [userId]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  return rows[0] || null;
}

async function update(id, fields) {
  const q = buildUpdate('categories', id, fields, UPDATABLE, { touchUpdatedAt: false });
  if (!q) return findById(id);
  const { rows } = await pool.query(q.text, q.values);
  return rows[0];
}

async function remove(id) {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}

module.exports = { create, findAllByUser, findById, update, remove };
