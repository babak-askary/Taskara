const userModel = require('../models/userModel');

async function getAllUsers(req, res, next) {
  try {
    const { search, limit, offset } = req.query;
    const users = await userModel.findAll({
      search,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    // Users can only update their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const updated = await userModel.update(userId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllUsers, getUserById, updateUser };
