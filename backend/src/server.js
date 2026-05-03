const app = require('./app');
const http = require('http');
const { initializeSocket } = require('./sockets/socketManager');
const pool = require('./config/db');

const PORT = process.env.PORT || 5001;
const REQUEST_TIMEOUT_MS = 30_000;
const SHUTDOWN_DEADLINE_MS = 10_000;

const server = http.createServer(app);
server.setTimeout(REQUEST_TIMEOUT_MS);

const io = initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown: stop accepting new connections, drain in-flight
// requests, close the DB pool and the socket server. A hard deadline
// guarantees the process exits even if something hangs.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received, draining`);

  const deadline = setTimeout(() => {
    console.error('[shutdown] deadline hit, forcing exit');
    process.exit(1);
  }, SHUTDOWN_DEADLINE_MS);
  deadline.unref();

  server.close((err) => {
    if (err) console.error('[shutdown] http close error:', err.message);
    else console.log('[shutdown] http server closed');
  });

  try {
    if (io) io.close();
  } catch (err) {
    console.error('[shutdown] socket.io close error:', err.message);
  }

  try {
    await pool.end();
    console.log('[shutdown] db pool closed');
  } catch (err) {
    console.error('[shutdown] db pool close error:', err.message);
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
