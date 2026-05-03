const { Server } = require('socket.io');
const pool = require('../config/db');
const taskModel = require('../models/taskModel');
const conversationModel = require('../models/conversationModel');

let io;

// Verify Auth0 token (same approach as authMiddleware) and return the DB user.
async function verifySocketToken(token) {
  if (!token) return null;
  const response = await fetch(
    `${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) return null;
  const auth0User = await response.json();

  const { rows } = await pool.query(
    'SELECT id, auth0_id, email, name, avatar_url, created_at, updated_at FROM users WHERE auth0_id = $1',
    [auth0User.sub]
  );
  return rows[0] || null;
}

function initializeSocket(server) {
  const origins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',').map((s) => s.trim()).filter(Boolean);
  io = new Server(server, {
    cors: { origin: origins, credentials: true },
  });

  // Auth middleware — token via socket.handshake.auth.token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const user = await verifySocketToken(token);
      if (!user) return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Auth error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, 'user:', socket.user.id);

    // Join the personal room for user-targeted notifications
    socket.join(`user:${socket.user.id}`);

    // Client requests to join a task room. Verify access first so a user
    // can't subscribe to updates on someone else's private task by guessing its id.
    socket.on('join-task', async (taskId) => {
      if (!Number.isInteger(taskId) || taskId <= 0) return;
      try {
        if (await taskModel.hasAccess(taskId, socket.user.id)) {
          socket.join(`task:${taskId}`);
        }
      } catch (err) {
        console.error('[socket] join-task access check failed:', err.message);
      }
    });

    // Client leaves a task room — no access check needed (leaving is harmless)
    socket.on('leave-task', (taskId) => {
      if (Number.isInteger(taskId) && taskId > 0) {
        socket.leave(`task:${taskId}`);
      }
    });

    // Chat room subscription. Verify access before joining so a user can't
    // peek at someone else's DM by guessing the conversation id.
    socket.on('chat:join', async (conversationId) => {
      if (!Number.isInteger(conversationId) || conversationId <= 0) return;
      try {
        const result = await conversationModel.findByIdForUser(conversationId, socket.user.id);
        if (result.allowed) socket.join(`chat:${conversationId}`);
      } catch (err) {
        console.error('[socket] chat:join access check failed:', err.message);
      }
    });

    socket.on('chat:leave', (conversationId) => {
      if (Number.isInteger(conversationId) && conversationId > 0) {
        socket.leave(`chat:${conversationId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

// Returns the io instance or null if socket.io hasn't started yet (during
// boot or in tests). Use this in fire-and-forget paths like notifications.
function tryGetIO() {
  return io || null;
}

module.exports = { initializeSocket, getIO, tryGetIO };
