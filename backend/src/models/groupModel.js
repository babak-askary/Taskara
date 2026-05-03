const pool = require('../config/db');
const { buildUpdate } = require('../utils/sql');

const UPDATABLE = ['name', 'slug', 'description'];
const COLUMNS = 'id, name, slug, description, owner_id, created_at, updated_at';

// Slug normalization: lowercase, alphanumerics + hyphens only, 3-60 chars.
// Used both server-side (defensive) and client-side (cosmetic).
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;

function isValidSlug(slug) {
  return typeof slug === 'string' && SLUG_RE.test(slug);
}

async function create({ name, slug, description, ownerId }) {
  const { rows } = await pool.query(
    `INSERT INTO groups (name, slug, description, owner_id)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [name, slug, description || null, ownerId]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM groups WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findBySlug(slug) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM groups WHERE LOWER(slug) = LOWER($1)`,
    [slug]
  );
  return rows[0] || null;
}

// All groups the user is a member of (or owns), with their role and a
// member count. Used on /groups list page.
async function findAllForUser(userId) {
  const { rows } = await pool.query(
    `SELECT g.id, g.name, g.slug, g.description, g.owner_id, g.created_at,
            gm.role,
            (SELECT COUNT(*)::int FROM group_members WHERE group_id = g.id) AS member_count
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = $1
     ORDER BY g.name ASC`,
    [userId]
  );
  return rows;
}

// Open discovery — match against name and slug. Used by the "Find a group"
// search box. Returns up to `limit` rows + whether the calling user is
// already a member of each.
async function search({ q, limit = 12, userId }) {
  const term = (q || '').trim();
  if (!term) return [];
  const like = `%${term.toLowerCase()}%`;
  const { rows } = await pool.query(
    `SELECT g.id, g.name, g.slug, g.description, g.owner_id, g.created_at,
            (SELECT COUNT(*)::int FROM group_members WHERE group_id = g.id) AS member_count,
            EXISTS(
              SELECT 1 FROM group_members
              WHERE group_id = g.id AND user_id = $2
            ) AS is_member
     FROM groups g
     WHERE LOWER(g.slug) LIKE $1 OR LOWER(g.name) LIKE $1
     ORDER BY (LOWER(g.slug) = LOWER($3)) DESC, g.name ASC
     LIMIT $4`,
    [like, userId, term, limit]
  );
  return rows;
}

async function update(id, fields) {
  const q = buildUpdate('groups', id, fields, UPDATABLE, { touchUpdatedAt: true });
  if (!q) return findById(id);
  const { rows } = await pool.query(q.text, q.values);
  return rows[0];
}

async function remove(id) {
  await pool.query('DELETE FROM groups WHERE id = $1', [id]);
}

module.exports = {
  create, findById, findBySlug, findAllForUser, search, update, remove,
  isValidSlug,
};
