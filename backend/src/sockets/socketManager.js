const { Server } = require('socket.io');
const pool = require('../config/db');

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
    'SELECT * FROM users WHERE auth0_id = $1',
    [auth0User.sub]
  );
  return rows[0] || null;
}

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
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

    // Client requests to join a task room (task detail page)
    socket.on('join-task', (taskId) => {
      if (Number.isInteger(taskId)) {
        socket.join(`task:${taskId}`);
      }
    });

    // Client leaves a task room
    socket.on('leave-task', (taskId) => {
      if (Number.isInteger(taskId)) {
        socket.leave(`task:${taskId}`);
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

module.exports = { initializeSocket, getIO };
