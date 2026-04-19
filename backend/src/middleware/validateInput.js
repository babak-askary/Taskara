// Recursively trim string fields and strip HTML tags to prevent stored XSS.
// Applied to req.body before controllers run.

const HTML_TAG_RE = /<[^>]*>/g;

function cleanString(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(HTML_TAG_RE, '');
}

function cleanValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return cleanString(value);
  if (Array.isArray(value)) return value.map(cleanValue);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = cleanValue(v);
    }
    return out;
  }
  return value;
}

// Middleware: clean req.body (only strings get trimmed/stripped)
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanValue(req.body);
  }
  next();
}

// Validate an email format
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = { sanitizeBody, isValidEmail, cleanString };
