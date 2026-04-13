const userModel = require('../models/userModel');

// Sync Auth0 user to our database on register
async function register(req, res, next) {
  try {
    const { email, name, picture } = req.body;
    const auth0Id = req.auth.payload.sub;

    const user = await userModel.findOrCreate({
      auth0Id,
      email,
      name: name || email,
      avatarUrl: picture || null,
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
    const auth0Id = req.auth.payload.sub;

    const user = await userModel.findOrCreate({
      auth0Id,
      email,
      name: name || email,
      avatarUrl: picture || null,
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
