const pool = require('../config/db');

// Create the row for a brand-new group's chat. Called from groupController
// right after the group is inserted.
async function createForGroup(groupId) {
  const { rows } = await pool.query(
    `INSERT INTO conversations (kind, group_id)
     VALUES ('group', $1)
     ON CONFLICT (group_id) DO UPDATE SET group_id = EXCLUDED.group_id
     RETURNING id, kind, group_id, created_at`,
    [groupId]
  );
  return rows[0];
}

async function findByGroupId(groupId) {
  const { rows } = await pool.query(
    `SELECT id, kind, group_id, created_at FROM conversations
     WHERE group_id = $1`,
    [groupId]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, kind, group_id, created_at FROM conversations WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

// Get the existing direct conversation between two users, or create one.
// Symmetric — order of arguments doesn't matter.
async function findOrCreateDirect(userIdA, userIdB) {
  if (userIdA === userIdB) throw new Error('cannot chat with yourself');
  // Look for an existing 'direct' convo where both users are participants.
  const { rows: existing } = await pool.query(
    `SELECT c.id FROM conversations c
     WHERE c.kind = 'direct'
       AND c.id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $1)
       AND c.id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $2)
     LIMIT 1`,
    [userIdA, userIdB]
  );
  if (existing[0]) {
    const { rows } = await pool.query(
      `SELECT id, kind, group_id, created_at FROM conversations WHERE id = $1`,
      [existing[0].id]
    );
    return rows[0];
  }
  // Create new convo + 2 participant rows.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: convoRows } = await client.query(
      `INSERT INTO conversations (kind) VALUES ('direct')
       RETURNING id, kind, group_id, created_at`
    );
    const convo = convoRows[0];
    await client.query(
      `INSERT INTO conversation_participants (conversation_id, user_id)
       VALUES ($1, $2), ($1, $3)`,
      [convo.id, userIdA, userIdB]
    );
    await client.query('COMMIT');
    return convo;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// All conversations the user can access: every group they're a member of,
// plus every direct convo they're in. Includes the last message preview and
// the "other party" info for direct chats.
async function findAllForUser(userId) {
  const { rows } = await pool.query(
    `WITH user_convos AS (
       -- Group chats via membership
       SELECT c.id, c.kind, c.group_id
       FROM conversations c
       JOIN group_members gm ON gm.group_id = c.group_id
       WHERE c.kind = 'group' AND gm.user_id = $1
       UNION
       -- Direct chats via participants
       SELECT c.id, c.kind, c.group_id
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       WHERE c.kind = 'direct' AND cp.user_id = $1
     ),
     last_msg AS (
       SELECT DISTINCT ON (m.conversation_id)
              m.conversation_id, m.body, m.created_at, m.sender_id,
              u.name AS sender_name
       FROM messages m
       LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id IN (SELECT id FROM user_convos)
       ORDER BY m.conversation_id, m.created_at DESC
     )
     SELECT uc.id, uc.kind, uc.group_id,
            g.name AS group_name, g.slug AS group_slug,
            -- Other party for direct chats
            ou.id   AS other_user_id,
            ou.name AS other_user_name,
            ou.email AS other_user_email,
            ou.avatar_url AS other_user_avatar,
            lm.body       AS last_body,
            lm.created_at AS last_at,
            lm.sender_name AS last_sender_name
     FROM user_convos uc
     LEFT JOIN groups g ON g.id = uc.group_id
     LEFT JOIN LATERAL (
       SELECT u.id, u.name, u.email, u.avatar_url
       FROM conversation_participants cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.conversation_id = uc.id AND cp.user_id <> $1
       LIMIT 1
     ) ou ON uc.kind = 'direct'
     LEFT JOIN last_msg lm ON lm.conversation_id = uc.id
     ORDER BY COALESCE(lm.created_at, NOW()) DESC`,
    [userId]
  );
  return rows;
}

// Hydrate a conversation with display info needed to render the thread
// header (group meta or other-user meta), plus calculate caller access.
async function findByIdForUser(id, userId) {
  const convo = await findById(id);
  if (!convo) return { found: false };

  if (convo.kind === 'group') {
    const { rows } = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [convo.group_id, userId]
    );
    if (rows.length === 0) return { found: true, allowed: false };
    const { rows: gRows } = await pool.query(
      `SELECT name, slug, description FROM groups WHERE id = $1`,
      [convo.group_id]
    );
    return {
      found: true,
      allowed: true,
      conversation: { ...convo, group_name: gRows[0]?.name, group_slug: gRows[0]?.slug },
    };
  }

  // Direct
  const { rows: meRows } = await pool.query(
    `SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (meRows.length === 0) return { found: true, allowed: false };
  const { rows: otherRows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.avatar_url
     FROM conversation_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = $1 AND cp.user_id <> $2
     LIMIT 1`,
    [id, userId]
  );
  return {
    found: true,
    allowed: true,
    conversation: {
      ...convo,
      other_user_id: otherRows[0]?.id,
      other_user_name: otherRows[0]?.name,
      other_user_email: otherRows[0]?.email,
      other_user_avatar: otherRows[0]?.avatar_url,
    },
  };
}

module.exports = {
  createForGroup, findByGroupId, findById, findOrCreateDirect,
  findAllForUser, findByIdForUser,
};
