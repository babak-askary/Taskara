const pool = require('../config/db');
const { buildUpdate } = require('../utils/sql');

const UPDATABLE = ['name', 'avatar_url'];
const PUBLIC_COLUMNS = 'id, email, name, avatar_url, created_at';
const FULL_COLUMNS = 'id, auth0_id, email, name, avatar_url, created_at, updated_at';

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function update(id, fields) {
  const q = buildUpdate('users', id, fields, UPDATABLE);
  if (!q) return findById(id);
  const { rows } = await pool.query(q.text, q.values);
  return rows[0];
}

async function findAll({ search, limit = 20, offset = 0 } = {}) {
  if (search) {
    const { rows } = await pool.query(
      `SELECT ${PUBLIC_COLUMNS}
       FROM users
       WHERE name ILIKE $1 OR email ILIKE $1
       ORDER BY name ASC
       LIMIT $2 OFFSET $3`,
      [`%${search}%`, limit, offset]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}
     FROM users
     ORDER BY name ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function findOrCreate({ auth0Id, email, name, avatarUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO users (auth0_id, email, name, avatar_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (auth0_id) DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name,
       avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
       updated_at = NOW()
     RETURNING ${FULL_COLUMNS}`,
    [auth0Id, email, name, avatarUrl]
  );
  return rows[0];
}

module.exports = { findById, update, findAll, findOrCreate };
