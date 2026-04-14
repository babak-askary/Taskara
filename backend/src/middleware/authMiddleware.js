const pool = require('../config/db');

// Verify Auth0 token by calling the Auth0 userinfo endpoint
// This works with opaque tokens (no audience needed)
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token by calling Auth0's userinfo endpoint
    const response = await fetch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const auth0User = await response.json();

    // Look up user in our database
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE auth0_id = $1',
      [auth0User.sub]
    );

    if (rows.length > 0) {
      req.user = rows[0];
    } else {
      // User not in DB yet — attach Auth0 info for profile sync
      req.user = {
        auth0_id: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name || auth0User.nickname || auth0User.email,
        avatar_url: auth0User.picture,
      };
    }

    // Also attach raw Auth0 profile
    req.auth0User = auth0User;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

module.exports = { authenticate };
