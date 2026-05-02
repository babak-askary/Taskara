// Parse a route/path parameter as a positive integer ID.
// Returns the integer, or null if the input isn't a clean positive-integer string.
// Strict on purpose — "abc", "1.5", "010", "-3", and "" all return null.
function parseId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isSafeInteger(n)) return null;
  return n;
}

module.exports = parseId;
