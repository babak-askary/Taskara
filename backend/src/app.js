require('./config/env');  // loads .env and validates required vars before anything else
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const aiRoutes = require('./routes/aiRoutes');
const groupRoutes = require('./routes/groupRoutes');
const chatRoutes = require('./routes/chatRoutes');

const { errorHandler } = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validateInput');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

// Global middleware
app.use(helmet());
// FRONTEND_URL can be a single URL or a comma-separated list (so previews
// + production can both call this API).
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeBody);
app.use(generalLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/chat', chatRoutes);

// Health check (not rate-limited, not protected — used by monitors).
// Returns 503 with details if the DB is unreachable so a load balancer or
// uptime check can take the instance out of rotation instead of routing
// requests that will all 500 anyway.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

// Error handling — last middleware
app.use(errorHandler);

module.exports = app;
