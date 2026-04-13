// Authentication middleware — to be implemented with Auth0/Google Auth
function authenticate(req, res, next) {
  // TODO: Verify JWT token from Auth0
  next();
}

module.exports = { authenticate };
