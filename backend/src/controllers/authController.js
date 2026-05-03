const userModel = require('../models/userModel');
const categoryModel = require('../models/categoryModel');

// Sync the Auth0 identity into our local users table. Called by both /register
// (first time, returns 201) and /login (returning user, returns 200).
async function syncUser(req, res, next, status) {
  try {
    const { email, name, picture } = req.body;
    const user = await userModel.findOrCreate({
      auth0Id: req.user.auth0_id,
      email: email || req.user.email,
      name: name || req.user.name || email,
      avatarUrl: picture || req.user.avatar_url || null,
    });
    // Seed starter categories on first login (no-op if any already exist).
    // Don't fail the login if seeding throws — the app still works without it.
    try { await categoryModel.seedDefaultsIfEmpty(user.id); }
    catch (err) { console.warn('[auth] category seed failed:', err.message); }
    res.status(status).json(user);
  } catch (err) {
    next(err);
  }
}

const register = (req, res, next) => syncUser(req, res, next, 201);
const login    = (req, res, next) => syncUser(req, res, next, 200);

// Return the current user's profile from our database
async function getProfile(req, res, next) {
  try {
    if (!req.user.id) {
      return res.status(404).json({ message: 'User not found in database. Please sync first.' });
    }
    res.json(req.user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile };
