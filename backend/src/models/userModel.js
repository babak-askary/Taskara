const pool = require('../config/db');
const { buildUpdate } = require('../utils/sql');

const UPDATABLE = ['name', 'avatar_url'];

async function findByAuth0Id(auth0Id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE auth0_id = $1', [auth0Id]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function create({ auth0Id, email, name, avatarUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO users (auth0_id, email, name, avatar_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [auth0Id, email, name, avatarUrl]
  );
  return rows[0];
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
      `SELECT id, email, name, avatar_url, created_at
       FROM users
       WHERE name ILIKE $1 OR email ILIKE $1
       ORDER BY name ASC
       LIMIT $2 OFFSET $3`,
      [`%${search}%`, limit, offset]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT id, email, name, avatar_url, created_at
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
     RETURNING *`,
    [auth0Id, email, name, avatarUrl]
  );
  return rows[0];
}

module.exports = { findByAuth0Id, findById, findByEmail, create, update, findAll, findOrCreate };
