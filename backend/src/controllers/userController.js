const userModel = require('../models/userModel');
const parseId = require('../utils/parseId');

const MAX_LIMIT = 200;

async function getAllUsers(req, res, next) {
  try {
    const { search, limit, offset } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
    const users = await userModel.findAll({
      search,
      limit: Math.max(1, Math.min(MAX_LIMIT, Number.isFinite(parsedLimit) ? parsedLimit : 20)),
      offset: Math.max(0, Number.isFinite(parsedOffset) ? parsedOffset : 0),
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const userId = parseId(req.params.id);
    if (userId === null) return res.status(400).json({ message: 'Invalid user id' });
    const user = await userModel.findById(userId);
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
    const userId = parseId(req.params.id);
    if (userId === null) return res.status(400).json({ message: 'Invalid user id' });

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
