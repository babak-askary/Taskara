const pool = require('../config/db');

const ROLES = ['owner', 'admin', 'member'];

function isValidRole(role) {
  return typeof role === 'string' && ROLES.includes(role);
}

async function add({ groupId, userId, role = 'member' }) {
  const { rows } = await pool.query(
    `INSERT INTO group_members (group_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (group_id, user_id) DO NOTHING
     RETURNING id, group_id, user_id, role, joined_at`,
    [groupId, userId, role]
  );
  return rows[0] || null;
}

async function remove(groupId, userId) {
  await pool.query(
    'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
}

async function updateRole(groupId, userId, role) {
  const { rows } = await pool.query(
    `UPDATE group_members SET role = $3
     WHERE group_id = $1 AND user_id = $2
     RETURNING id, group_id, user_id, role, joined_at`,
    [groupId, userId, role]
  );
  return rows[0] || null;
}

// All members with user fields joined for display. Sorted: owner first,
// then admins, then members alphabetically.
async function findByGroup(groupId) {
  const { rows } = await pool.query(
    `SELECT gm.id AS membership_id, gm.role, gm.joined_at,
            u.id, u.name, u.email, u.avatar_url
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY
       CASE gm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
       u.name ASC`,
    [groupId]
  );
  return rows;
}

// Returns the role string ('owner'/'admin'/'member') or null if not a member.
async function findUserRole(groupId, userId) {
  const { rows } = await pool.query(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return rows[0]?.role || null;
}

async function isMember(groupId, userId) {
  return (await findUserRole(groupId, userId)) !== null;
}

module.exports = {
  add, remove, updateRole, findByGroup, findUserRole, isMember,
  isValidRole, ROLES,
};
