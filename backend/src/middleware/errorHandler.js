// Centralized error handler — called for any error passed via next(err).
// Hides stack traces in production, categorizes known error types.

// PostgreSQL SQLSTATE codes we map to user-friendly responses.
const PG_ERROR_MAP = {
  '23505': { status: 409, message: 'Duplicate value conflicts with existing record' },
  '23503': { status: 400, message: 'Referenced record does not exist' },
  '23502': { status: 400, message: 'A required field is missing' },
  '23514': { status: 400, message: 'A value violates a database constraint' },
  '40P01': { status: 503, message: 'The server is busy, please retry' },
};

function errorHandler(err, req, res, next) {
  // Log full details server-side
  console.error('[error]', err.stack || err.message);

  const isProduction = process.env.NODE_ENV === 'production';

  const mapped = PG_ERROR_MAP[err.code];
  const statusCode = mapped?.status || err.statusCode || err.status || 500;
  const message = mapped?.message || err.message || 'Internal Server Error';

  const body = { error: { message, statusCode } };

  // Include stack trace only outside production
  if (!isProduction && err.stack) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = { errorHandler };
