const userModel = require('../models/userModel');

// Sync Auth0 user to our database on register
async function register(req, res, next) {
  try {
    const { email, name, picture } = req.body;
    const auth0Id = req.user.auth0_id;

    const user = await userModel.findOrCreate({
      auth0Id,
      email: email || req.user.email,
      name: name || req.user.name || email,
      avatarUrl: picture || req.user.avatar_url || null,
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

// Sync Auth0 user to our database on login
async function login(req, res, next) {
  try {
    const { email, name, picture } = req.body;
    const auth0Id = req.user.auth0_id;

    const user = await userModel.findOrCreate({
      auth0Id,
      email: email || req.user.email,
      name: name || req.user.name || email,
      avatarUrl: picture || req.user.avatar_url || null,
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

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
