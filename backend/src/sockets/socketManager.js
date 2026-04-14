const { Server } = require('socket.io');

let io;

function initializeSocket(server) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error('Missing FRONTEND_URL environment variable. Define it in backend/.env.');
  }

  io = new Server(server, {
    cors: {
      origin: frontendUrl,
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

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
