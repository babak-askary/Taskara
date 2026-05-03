import { Link } from 'react-router-dom';
import { fmtShort, isToday, isOverdue } from '../../utils/dateFormat';

function TaskRow({ task, onToggle, onDelete }) {
  const overdue = isOverdue(task.due_date, task.status);
  const today = isToday(task.due_date);
  const done = task.status === 'done';
  const inProgress = task.status === 'in_progress';

  return (
    <li className={`task-row ${done ? 'is-done' : ''} ${overdue ? 'is-overdue' : ''}`}>
      <button
        className={`task-check ${done ? 'is-checked' : ''}`}
        onClick={() => onToggle(task)}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
      >
        {done && (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 8l3.5 3.5L13 5" />
          </svg>
        )}
      </button>

      <span
        className={`task-pri-bar pri-${task.priority || 'low'}`}
        role="img"
        aria-label={`${task.priority || 'low'} priority`}
      />

      <Link to={`/tasks/${task.id}`} className="task-main">
        <div className="task-title-row">
          <span className="task-title">{task.title}</span>
          {task.is_recurring && (
            <span className="task-recurring" role="img" aria-label="Recurring task" title="Recurring task">
              ↻
            </span>
          )}
          {inProgress && <span className="task-chip task-chip-progress">In progress</span>}
        </div>
        {task.description && !done && <p className="task-desc">{task.description}</p>}
      </Link>

      <div className="task-meta">
        {task.time_spent > 0 && (
          <span className="task-time" title={`${task.time_spent} minutes logged`}>
            {task.time_spent >= 60
              ? `${Math.floor(task.time_spent / 60)}h${task.time_spent % 60 ? ` ${task.time_spent % 60}m` : ''}`
              : `${task.time_spent}m`}
          </span>
        )}
        {task.category_name && (
          <span className="task-cat" style={{ color: task.category_color || 'var(--text-dim)' }}>
            {task.category_name}
          </span>
        )}
        <span
          className={`task-due ${
            !task.due_date ? 'is-none' : overdue ? 'is-overdue' : today ? 'is-today' : ''
          }`}
        >
          {task.due_date ? fmtShort(task.due_date) : 'No date'}
        </span>
      </div>

      <button
        className="task-delete"
        onClick={() => onDelete(task)}
        aria-label="Delete task"
        title="Delete"
        type="button"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        </svg>
      </button>
    </li>
  );
}

export default TaskRow;
