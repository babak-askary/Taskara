const pool = require('../config/db');

// Simple in-memory cache for Auth0 tokens.
// Avoids calling Auth0's /userinfo endpoint on every request (saves ~100-200ms).
const TTL_MS = 5 * 60 * 1000;  // 5 minutes
const MAX = 1000;
const cache = new Map();       // token -> { user, auth0User, expires }

function cacheGet(token) {
  const entry = cache.get(token);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    cache.delete(token);
    return null;
  }
  return entry;
}

function cacheSet(token, user, auth0User) {
  if (cache.size >= MAX) {
    // Evict the oldest entry (Map keys are insertion-ordered)
    cache.delete(cache.keys().next().value);
  }
  cache.set(token, { user, auth0User, expires: Date.now() + TTL_MS });
}

// For tests / manual invalidation
function clearAuthCache() {
  cache.clear();
}

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = header.slice('Bearer '.length);

    // Cache hit — skip the network call
    const cached = cacheGet(token);
    if (cached) {
      req.user = cached.user;
      req.auth0User = cached.auth0User;
      return next();
    }

    // Cache miss — verify with Auth0
    const response = await fetch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    const auth0User = await response.json();

    // Look up the DB user (or attach Auth0 info for first-time sync)
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE auth0_id = $1',
      [auth0User.sub]
    );

    const user = rows[0] || {
      auth0_id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name || auth0User.nickname || auth0User.email,
      avatar_url: auth0User.picture,
    };

    cacheSet(token, user, auth0User);
    req.user = user;
    req.auth0User = auth0User;
    next();
  } catch (err) {
    console.error('[auth] verification failed:', err.message);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

module.exports = { authenticate, clearAuthCache };
