// Supported recurrence rules. Keep this short and human — no iCal RRULE.
const RULES = ['daily', 'weekly', 'monthly'];

function isValidRule(rule) {
  return typeof rule === 'string' && RULES.includes(rule);
}

// Return the next due date as a Date, given a rule and a starting Date.
// If `from` is null/undefined, anchors at "now".
function nextDueDate(rule, from) {
  const base = from ? new Date(from) : new Date();
  if (Number.isNaN(base.getTime())) return null;

  const next = new Date(base);
  switch (rule) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      return next;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      return next;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      return next;
    default:
      return null;
  }
}

module.exports = { RULES, isValidRule, nextDueDate };
