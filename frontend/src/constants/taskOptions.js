// Single source of truth for the task enums shown in pickers and chip rows.
// Keep in sync with the backend validator in taskController.js.

export const STATUSES = [
  { value: 'todo',        label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done',        label: 'Done' },
];

export const STATUS_CHIPS = [
  { value: '',            label: 'All' },
  ...STATUSES,
];

export const PRIORITY_OPTIONS = [
  { value: '',       label: 'All priorities' },
  { value: 'high',   label: 'High priority' },
  { value: 'medium', label: 'Medium priority' },
  { value: 'low',    label: 'Low priority' },
];

export const SORT_OPTIONS = [
  { value: 'due_date:ASC',    label: 'Due date' },
  { value: 'created_at:DESC', label: 'Newest' },
  { value: 'created_at:ASC',  label: 'Oldest' },
  { value: 'title:ASC',       label: 'Title A–Z' },
];
