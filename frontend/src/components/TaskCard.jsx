import { useNavigate } from 'react-router-dom';
import { formatCardDate, isOverdue, formatTime } from '../utils/formatters.js';

const STATUS_META = {
  todo: { label: 'To Do', cls: 'badge-todo' },
  'in-progress': { label: 'In Progress', cls: 'badge-progress' },
  completed: { label: 'Done', cls: 'badge-done' },
};

const PRIORITY_META = {
  low: { label: 'Low', cls: 'badge-low' },
  medium: { label: 'Medium', cls: 'badge-medium' },
  high: { label: 'High', cls: 'badge-high' },
};

const CATEGORY_ICONS = {
  Work: '💼',
  Personal: '🙂',
  Health: '💪',
  Shopping: '🛒',
  Education: '📚',
  Other: '📌',
};

export function TaskCard({ task, onEdit, onDelete, onToggleStatus }) {
  const navigate = useNavigate();
  const overdue = isOverdue(task.deadline, task.status);
  const status = STATUS_META[task.status] || STATUS_META.todo;
  const priority = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const categoryIcon = CATEGORY_ICONS[task.category] || '📌';

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${task.title}"?`)) onDelete(task.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggleStatus(task);
  };

  return (
    <div
      className={`task-card${task.status === 'completed' ? ' task-card--done' : ''}`}
      onClick={() => navigate(`/tasks/${task.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/tasks/${task.id}`)}
    >
      {/* Header row */}
      <div className="task-card-header">
        <span className="task-category-icon" title={task.category}>{categoryIcon}</span>
        <span className={`badge ${status.cls}`}>{status.label}</span>
        <span className={`badge ${priority.cls}`}>{priority.label}</span>
        {task.recurring !== 'none' && (
          <span className="badge badge-recurring" title={`Recurring: ${task.recurring}`}>🔁</span>
        )}
      </div>

      {/* Title */}
      <h3 className="task-card-title">{task.title}</h3>

      {/* Description preview */}
      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      {/* Meta row */}
      <div className="task-card-meta">
        {task.deadline && (
          <span className={`task-deadline${overdue ? ' overdue' : ''}`}>
            📅 {formatCardDate(task.deadline)}{overdue ? ' · Overdue' : ''}
          </span>
        )}
        {task.timeSpent > 0 && (
          <span className="task-time">⏱ {formatTime(task.timeSpent)}</span>
        )}
        {task.comments?.length > 0 && (
          <span className="task-comments">💬 {task.comments.length}</span>
        )}
        {task.attachments?.length > 0 && (
          <span className="task-attachments">📎 {task.attachments.length}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="task-card-actions">
        <button
          className={`btn btn-sm ${task.status === 'completed' ? 'btn-secondary' : 'btn-success'}`}
          onClick={handleToggle}
          title={task.status === 'completed' ? 'Mark as To Do' : 'Mark as Done'}
        >
          {task.status === 'completed' ? '↩ Reopen' : '✓ Done'}
        </button>
        <button className="btn btn-sm btn-ghost" onClick={handleEdit} title="Edit">
          ✏️
        </button>
        <button className="btn btn-sm btn-ghost btn-danger" onClick={handleDelete} title="Delete">
          🗑️
        </button>
      </div>
    </div>
  );
}
