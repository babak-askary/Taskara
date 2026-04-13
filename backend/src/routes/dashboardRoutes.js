const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/stats', authenticate, dashboardController.getStats);
router.get('/performance', authenticate, dashboardController.getPerformance);

module.exports = router;
