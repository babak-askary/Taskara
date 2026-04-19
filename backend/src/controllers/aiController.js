const aiService = require('../services/aiService');

// POST /api/ai/ask  { prompt } -> { reply, source }
async function ask(req, res, next) {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ message: 'prompt is required' });
    }
    if (prompt.length > 2000) {
      return res.status(400).json({ message: 'prompt is too long (max 2000 chars)' });
    }

    const result = await aiService.ask(req.user.id, prompt.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { ask };
