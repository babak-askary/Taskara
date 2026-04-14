require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const frontendUrl = process.env.FRONTEND_URL;

if (!frontendUrl) {
  throw new Error('Missing FRONTEND_URL environment variable. Define it in backend/.env.');
}

// Global middleware
app.use(helmet());
app.use(cors({ origin: frontendUrl }));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

module.exports = app;
