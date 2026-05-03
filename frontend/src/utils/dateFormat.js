// Shared date formatters used across DashboardPage, TasksPage, TaskDetailPage.
// Intentionally a small set — anything page-specific stays in the page.

// "Monday, January 1" — for the dashboard greeting
export function fmtDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// "Jan 5" — compact form used everywhere for task due dates
export function fmtShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

// "just now" / "5m ago" / "2h ago" / "3d ago" / "Jan 5, 2026"
export function relativeTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

// "Today" / "Tomorrow" / "Yesterday" / "May 4" — for compact pills where
// near-future days deserve a friendly label.
export function fmtFriendly(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const dDay = new Date(d).setHours(0, 0, 0, 0);
  const tDay = new Date(today).setHours(0, 0, 0, 0);
  const diff = Math.round((dDay - tDay) / oneDay);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  return new Date(dateStr) < new Date();
}

// "Every day at 5:00 AM" / "Every Monday at 3:00 PM" / "Monthly on the 4th at 9:30 AM"
// Returns null if `rule` is invalid or `dateStr` is missing.
export function recurrenceLabel(rule, dateStr) {
  if (!rule || !dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  switch (rule) {
    case 'daily':
      return `Every day at ${time}`;
    case 'weekly': {
      const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
      return `Every ${weekday} at ${time}`;
    }
    case 'monthly': {
      const day = d.getDate();
      const suffix = (day % 10 === 1 && day !== 11) ? 'st'
        : (day % 10 === 2 && day !== 12) ? 'nd'
        : (day % 10 === 3 && day !== 13) ? 'rd'
        : 'th';
      return `Monthly on the ${day}${suffix} at ${time}`;
    }
    default:
      return null;
  }
}
