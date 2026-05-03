const pool = require('../config/db');

const SELECT_WITH_SENDER = `
  SELECT m.id, m.conversation_id, m.sender_id, m.body, m.created_at,
         u.name AS sender_name,
         u.email AS sender_email,
         u.avatar_url AS sender_avatar
  FROM messages m
  LEFT JOIN users u ON u.id = m.sender_id
`;

async function create({ conversationId, senderId, body }) {
  const { rows } = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, body)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [conversationId, senderId, body]
  );
  const { rows: full } = await pool.query(
    `${SELECT_WITH_SENDER} WHERE m.id = $1`,
    [rows[0].id]
  );
  return full[0];
}

// Newest-first paginated read. Reverse on the client for chronological
// display (or pass `chronological=true` to flip).
async function findByConversation(conversationId, { limit = 100, before } = {}) {
  const params = [conversationId];
  let where = 'WHERE m.conversation_id = $1';
  if (before) {
    params.push(before);
    where += ` AND m.created_at < $${params.length}`;
  }
  params.push(limit);
  const { rows } = await pool.query(
    `${SELECT_WITH_SENDER}
     ${where}
     ORDER BY m.created_at DESC
     LIMIT $${params.length}`,
    params
  );
  return rows.reverse(); // chronological: oldest -> newest
}

module.exports = { create, findByConversation };
