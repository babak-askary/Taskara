const { auth } = require('express-oauth2-jwt-bearer');
const pool = require('../config/db');

// Verify Auth0 JWT token
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256',
});

// After JWT is verified, find or create the user in our database
async function attachUser(req, res, next) {
  try {
    const auth0Id = req.auth.payload.sub;

    // Look up user by auth0_id
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE auth0_id = $1',
      [auth0Id]
    );

    if (rows.length > 0) {
      req.user = rows[0];
    } else {
      // User doesn't exist yet — will be created on first profile sync
      req.user = { auth0_id: auth0Id };
    }

    next();
  } catch (err) {
    next(err);
  }
}

// Combined middleware: verify token + attach user
function authenticate(req, res, next) {
  checkJwt(req, res, (err) => {
    if (err) return next(err);
    attachUser(req, res, next);
  });
}

module.exports = { authenticate };
