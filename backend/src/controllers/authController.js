// Each function handles one auth action

async function register(req, res, next) {
  try {
    // TODO: Implement user registration
    res.status(501).json({ message: 'Register not yet implemented' });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    // TODO: Implement login via Auth0/Google Auth
    res.status(501).json({ message: 'Login not yet implemented' });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    // TODO: Return current user profile
    res.status(501).json({ message: 'Get profile not yet implemented' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile };
