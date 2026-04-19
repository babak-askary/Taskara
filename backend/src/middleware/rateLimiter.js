const rateLimit = require('express-rate-limit');

// Rate limits exist to block abuse in production. Skip them in dev so local
// testing doesn't get choked during refresh/edit cycles.
const skipInDev = () => process.env.NODE_ENV !== 'production';

// General limit: 600 requests per 15 minutes per IP (prod only)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down' },
  skip: skipInDev,
});

// Stricter limit for auth endpoints (prevents brute force attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later' },
  skip: skipInDev,
});

// Upload limit — file uploads are expensive
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many uploads, please try again later' },
  skip: skipInDev,
});

// AI limit — external API calls are quota-limited
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI request limit reached, please try again in an hour' },
  skip: skipInDev,
});

module.exports = { generalLimiter, authLimiter, uploadLimiter, aiLimiter };
