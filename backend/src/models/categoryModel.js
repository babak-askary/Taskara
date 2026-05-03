const pool = require('../config/db');
const { buildUpdate } = require('../utils/sql');

const UPDATABLE = ['name', 'color'];
const COLUMNS = 'id, name, color, user_id, created_at';

async function create({ name, color, userId }) {
  const { rows } = await pool.query(
    `INSERT INTO categories (name, color, user_id)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNS}`,
    [name, color || '#6366f1', userId]
  );
  return rows[0];
}

async function findAllByUser(userId) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM categories WHERE user_id = $1 ORDER BY name ASC`,
    [userId]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM categories WHERE id = $1`,
    [id]
  );
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

// Starter set seeded on first login. Picked to cover the common buckets a
// student/professional juggles. Users can rename, recolor, or delete any of
// these — they're not special in the schema.
const DEFAULT_CATEGORIES = [
  { name: 'Work',       color: '#f97316' },
  { name: 'School',     color: '#3b82f6' },
  { name: 'University', color: '#8b5cf6' },
  { name: 'Homework',   color: '#10b981' },
  { name: 'Study',      color: '#14b8a6' },
  { name: 'Meeting',    color: '#ef4444' },
  { name: 'Personal',   color: '#ec4899' },
  { name: 'Errands',    color: '#eab308' },
];

// Seed the starter list iff the user has zero categories. Idempotent — safe
// to call on every login. The NOT EXISTS guard runs in the same statement
// as the insert so concurrent logins won't double-seed in the common case.
async function seedDefaultsIfEmpty(userId) {
  const params = [userId];
  const placeholders = DEFAULT_CATEGORIES.map((c) => {
    params.push(c.name, c.color);
    return `($${params.length - 1}, $${params.length})`;
  });
  await pool.query(
    `INSERT INTO categories (name, color, user_id)
     SELECT v.name, v.color, $1
     FROM (VALUES ${placeholders.join(', ')}) AS v(name, color)
     WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id = $1)`,
    params
  );
}

module.exports = { create, findAllByUser, findById, update, remove, seedDefaultsIfEmpty };
