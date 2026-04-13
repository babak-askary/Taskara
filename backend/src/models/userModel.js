const pool = require('../config/db');

async function findByAuth0Id(auth0Id) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE auth0_id = $1',
    [auth0Id]
  );
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
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
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
  const allowed = ['name', 'avatar_url'];
  const sets = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${i}`);
      values.push(fields[key]);
      i++;
    }
  }

  if (sets.length === 0) return findById(id);

  sets.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0];
}

async function findAll({ search, limit = 20, offset = 0 }) {
  const values = [];
  let where = '';

  if (search) {
    where = 'WHERE name ILIKE $1 OR email ILIKE $1';
    values.push(`%${search}%`);
  }

  values.push(limit, offset);
  const limitIdx = values.length - 1;

  const { rows } = await pool.query(
    `SELECT id, email, name, avatar_url, created_at
     FROM users ${where}
     ORDER BY name ASC
     LIMIT $${limitIdx} OFFSET $${limitIdx + 1}`,
    values
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
