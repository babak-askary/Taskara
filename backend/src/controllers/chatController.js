const conversationModel = require('../models/conversationModel');
const messageModel = require('../models/messageModel');
const userModel = require('../models/userModel');
const groupMemberModel = require('../models/groupMemberModel');
const { tryGetIO } = require('../sockets/socketManager');
const parseId = require('../utils/parseId');
const pool = require('../config/db');

const MAX_MESSAGE_LEN = 4000;

async function listConversations(req, res, next) {
  try {
    const convos = await conversationModel.findAllForUser(req.user.id);
    res.json(convos);
  } catch (err) { next(err); }
}

async function getConversation(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'Invalid id' });
    const result = await conversationModel.findByIdForUser(id, req.user.id);
    if (!result.found) return res.status(404).json({ message: 'Conversation not found' });
    if (!result.allowed) return res.status(403).json({ message: 'No access to this conversation' });
    res.json(result.conversation);
  } catch (err) { next(err); }
}

// Same access rule as the conversation: a member of the linked group, or
// listed in conversation_participants for direct chats.
async function ensureAccess(conversationId, userId) {
  const result = await conversationModel.findByIdForUser(conversationId, userId);
  if (!result.found) return { ok: false, status: 404, message: 'Conversation not found' };
  if (!result.allowed) return { ok: false, status: 403, message: 'No access to this conversation' };
  return { ok: true, conversation: result.conversation };
}

async function listMessages(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'Invalid id' });
    const access = await ensureAccess(id, req.user.id);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10), 200) : 100;
    const before = req.query.before || undefined;
    const messages = await messageModel.findByConversation(id, { limit, before });
    res.json(messages);
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'Invalid id' });
    const access = await ensureAccess(id, req.user.id);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const body = (req.body?.body || '').toString();
    if (!body.trim()) return res.status(400).json({ message: 'message body is required' });
    if (body.length > MAX_MESSAGE_LEN) {
      return res.status(400).json({ message: `message must be ${MAX_MESSAGE_LEN} chars or less` });
    }

    const message = await messageModel.create({
      conversationId: id,
      senderId: req.user.id,
      body: body.trim(),
    });

    // Realtime fan-out via socket.io. Anyone who joined the conversation
    // room gets the message instantly. The HTTP response also includes it
    // so the sender doesn't depend on the round-trip via socket.
    const io = tryGetIO();
    if (io) io.to(`chat:${id}`).emit('chat:message', message);

    res.status(201).json(message);
  } catch (err) { next(err); }
}

// Get-or-create a direct chat with a user identified by email. Returns the
// conversation row (existing or new). Used by the "start a DM" flow.
async function startDirect(req, res, next) {
  try {
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'email is required' });
    if (req.user.email && email === req.user.email.toLowerCase()) {
      return res.status(400).json({ message: "You can't start a DM with yourself" });
    }
    const { rows } = await pool.query(
      'SELECT id, name, email, avatar_url FROM users WHERE LOWER(email) = $1',
      [email]
    );
    const target = rows[0];
    if (!target) return res.status(404).json({ message: 'No user with that email' });
    const convo = await conversationModel.findOrCreateDirect(req.user.id, target.id);
    res.json({
      ...convo,
      other_user_id: target.id,
      other_user_name: target.name,
      other_user_email: target.email,
      other_user_avatar: target.avatar_url,
    });
  } catch (err) { next(err); }
}

// Find the (auto-created) conversation for a group, so the GroupDetail
// page can deep-link to /chat/:id.
async function getGroupConversation(req, res, next) {
  try {
    const groupId = parseId(req.params.groupId);
    if (groupId === null) return res.status(400).json({ message: 'Invalid id' });
    const role = await groupMemberModel.findUserRole(groupId, req.user.id);
    if (!role) return res.status(403).json({ message: 'Not a member of this group' });
    let convo = await conversationModel.findByGroupId(groupId);
    if (!convo) {
      // Defensive: an old group might pre-date the chat feature. Create on demand.
      convo = await conversationModel.createForGroup(groupId);
    }
    res.json(convo);
  } catch (err) { next(err); }
}

module.exports = {
  listConversations, getConversation, listMessages, sendMessage,
  startDirect, getGroupConversation,
};
