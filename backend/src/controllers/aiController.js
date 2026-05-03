const aiService = require('../services/aiService');

// POST /api/ai/ask  { prompt } -> { reply, source }
// Reject anything that isn't a valid IANA zone so a malicious or malformed
// value can't crash Intl.DateTimeFormat downstream.
function safeTimezone(tz) {
  if (!tz || typeof tz !== 'string') return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

async function ask(req, res, next) {
  try {
    const { prompt, timezone } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ message: 'prompt is required' });
    }
    if (prompt.length > 2000) {
      return res.status(400).json({ message: 'prompt is too long (max 2000 chars)' });
    }

    const result = await aiService.ask(req.user.id, prompt.trim(), {
      timezone: safeTimezone(timezone),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { ask };
