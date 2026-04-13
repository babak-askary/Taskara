const app = require('./app');
const http = require('http');
const { initializeSocket } = require('./sockets/socketManager');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io for real-time updates
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
