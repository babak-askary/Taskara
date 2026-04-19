require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const { errorHandler } = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validateInput');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
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

// Health check (not rate-limited, not protected — used by monitors)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling — last middleware
app.use(errorHandler);

module.exports = app;
