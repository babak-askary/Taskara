const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// All auth routes require a valid Auth0 token
router.post('/register', authenticate, authController.register);
router.post('/login', authenticate, authController.login);
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
