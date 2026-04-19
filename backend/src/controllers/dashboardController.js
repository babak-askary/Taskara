const dashboardModel = require('../models/dashboardModel');

// GET /api/dashboard/stats — task counts + category breakdown
async function getStats(req, res, next) {
  try {
    const [stats, categoryBreakdown] = await Promise.all([
      dashboardModel.getTaskStats(req.user.id),
      dashboardModel.getCategoryBreakdown(req.user.id),
    ]);

    res.json({ stats, category_breakdown: categoryBreakdown });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/performance — completion trend + metrics
async function getPerformance(req, res, next) {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 14;
    const safeDays = Math.max(1, Math.min(days, 90)); // clamp 1-90

    const [metrics, trend] = await Promise.all([
      dashboardModel.getPerformanceMetrics(req.user.id),
      dashboardModel.getCompletionTrend(req.user.id, safeDays),
    ]);

    res.json({ metrics, trend });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, getPerformance };
