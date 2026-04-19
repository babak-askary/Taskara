// Centralized error handler — called for any error passed via next(err).
// Hides stack traces in production, categorizes known error types.
function errorHandler(err, req, res, next) {
  // Log full details server-side
  console.error('[error]', err.stack || err.message);

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const body = {
    error: {
      message: err.message || 'Internal Server Error',
      statusCode,
    },
  };

  // Include stack trace only outside production
  if (!isProduction && err.stack) {
    body.error.stack = err.stack;
  }

  // Map common error categories
  if (err.code === '23505') {
    body.error.message = 'Duplicate value conflicts with existing record';
    return res.status(409).json(body);
  }
  if (err.code === '23503') {
    body.error.message = 'Referenced record does not exist';
    return res.status(400).json(body);
  }

  res.status(statusCode).json(body);
}

module.exports = { errorHandler };
