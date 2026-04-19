import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  getTasks,
  searchTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../api/taskApi';
import { getCategories } from '../api/categoryApi';
import { errorMessage } from '../api/client';
import DueDatePicker from '../components/common/DueDatePicker';

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'high', label: 'High priority' },
  { value: 'medium', label: 'Medium priority' },
  { value: 'low', label: 'Low priority' },
];

const SORT_OPTIONS = [
  { value: 'due_date:ASC', label: 'Due date' },
  { value: 'created_at:DESC', label: 'Newest' },
  { value: 'created_at:ASC', label: 'Oldest' },
  { value: 'title:ASC', label: 'Title A–Z' },
];

function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  return new Date(dateStr) < new Date();
}

function TasksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('due_date:ASC');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingTitle, setPendingTitle] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Categories (loaded once)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getCategories()
      .then((res) => { if (!cancelled) setCategories(res.data || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Tasks — re-fetch when filters change
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const [sortBy, sortOrder] = sort.split(':');
    const params = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(categoryId && { category_id: categoryId }),
      sort_by: sortBy,
      sort_order: sortOrder,
      limit: 200,
    };

    const call = search
      ? searchTasks({ ...params, q: search })
      : getTasks(params);

    call
      .then((res) => { if (!cancelled) setTasks(res.data || []); })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load tasks.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated, status, priority, categoryId, sort, search]);

  const counts = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done').length;
    const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
    const done = tasks.filter((t) => t.status === 'done').length;
    return { open, overdue, done, total: tasks.length };
  }, [tasks]);

  function handleQuickAdd(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || adding) return;
    // Open the date picker; actual creation happens in its callbacks.
    setPendingTitle(title);
    setPickerOpen(true);
  }

  async function createPendingTask(dueDateIso) {
    if (adding || !pendingTitle) return;
    setAdding(true);
    try {
      const payload = dueDateIso
        ? { title: pendingTitle, due_date: dueDateIso }
        : { title: pendingTitle };
      const res = await createTask(payload);
      setTasks((prev) => [res.data, ...prev]);
      setNewTitle('');
      setPendingTitle('');
      setPickerOpen(false);
    } catch (err) {
      console.error('[create task]', err);
      alert(errorMessage(err, 'Could not create task.'));
    } finally {
      setAdding(false);
    }
  }

  function handlePickerCancel() {
    if (adding) return;
    setPickerOpen(false);
    setPendingTitle('');
  }

  async function handleToggle(task) {
    const next = task.status === 'done' ? 'todo' : 'done';
    const prev = task.status;
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      await updateTask(task.id, { status: next });
    } catch (err) {
      console.error('[update task]', err);
      setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: prev } : t)));
      alert(errorMessage(err, 'Could not update task.'));
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    const before = tasks;
    setTasks((list) => list.filter((t) => t.id !== task.id));
    try {
      await deleteTask(task.id);
    } catch (err) {
      console.error('[delete task]', err);
      setTasks(before);
      alert(errorMessage(err, 'Could not delete task.'));
    }
  }

  function clearFilters() {
    setStatus('');
    setPriority('');
    setCategoryId('');
    setSearchInput('');
    setSearch('');
  }

  if (authLoading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const hasFilters = Boolean(status || priority || categoryId || search);

  return (
    <div className="tasks">
      <header className="tasks-header">
        <p className="tasks-eyebrow">Workspace</p>
        <h1 className="tasks-title">Your tasks</h1>
        <p className="tasks-count">
          <strong>{counts.open}</strong> open
          {counts.overdue > 0 && (
            <>{' · '}<span className="tasks-count-bad">{counts.overdue} overdue</span></>
          )}
          {counts.done > 0 && ` · ${counts.done} done`}
        </p>
      </header>

      <form className="tasks-add" onSubmit={handleQuickAdd}>
        <span className="tasks-add-icon" aria-hidden="true">+</span>
        <input
          className="tasks-add-input"
          type="text"
          placeholder="Add a task — press Enter to create"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={adding}
          maxLength={255}
        />
        {newTitle.trim() && (
          <button type="submit" className="tasks-add-btn" disabled={adding}>
            {adding ? 'Adding…' : 'Add'}
          </button>
        )}
      </form>

      <section className="tasks-toolbar">
        <div className="tasks-search">
          <svg
            className="tasks-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            className="tasks-search-input"
            type="search"
            placeholder="Search tasks…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="tasks-chips">
          {STATUS_CHIPS.map((s) => (
            <button
              key={s.value || 'all'}
              type="button"
              className={`tasks-chip ${status === s.value ? 'is-active' : ''}`}
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="tasks-selects">
          <select
            className="tasks-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Priority filter"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value || 'all'} value={p.value}>{p.label}</option>
            ))}
          </select>

          {categories.length > 0 && (
            <select
              className="tasks-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label="Category filter"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          <select
            className="tasks-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort order"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>Sort: {s.label}</option>
            ))}
          </select>

          {hasFilters && (
            <button type="button" className="tasks-clear" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </section>

      <DueDatePicker
        isOpen={pickerOpen}
        taskTitle={pendingTitle}
        onConfirm={(iso) => createPendingTask(iso)}
        onSkip={() => createPendingTask(null)}
        onClose={handlePickerCancel}
      />

      <section className="tasks-list">
        {loading ? (
          <div className="tasks-skel">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="dash-skel tasks-skel-row" />
            ))}
          </div>
        ) : error ? (
          <p className="dash-empty dash-error">{error}</p>
        ) : tasks.length === 0 ? (
          <div className="tasks-empty">
            <p className="tasks-empty-title">
              {hasFilters ? 'No tasks match those filters.' : "You're all clear."}
            </p>
            <p className="tasks-empty-sub">
              {hasFilters
                ? 'Try clearing a filter or adjusting your search.'
                : 'Add your first task with the input above.'}
            </p>
          </div>
        ) : (
          <ul className="tasks-rows">
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }) {
  const overdue = isOverdue(task.due_date, task.status);
  const today = isToday(task.due_date);
  const done = task.status === 'done';
  const inProgress = task.status === 'in_progress';

  return (
    <li
      className={`task-row ${done ? 'is-done' : ''} ${overdue ? 'is-overdue' : ''}`}
    >
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

      <span className={`task-pri-bar pri-${task.priority || 'low'}`} />

      <Link to={`/tasks/${task.id}`} className="task-main">
        <div className="task-title-row">
          <span className="task-title">{task.title}</span>
          {inProgress && (
            <span className="task-chip task-chip-progress">In progress</span>
          )}
        </div>
        {task.description && !done && (
          <p className="task-desc">{task.description}</p>
        )}
      </Link>

      <div className="task-meta">
        {task.category_name && (
          <span
            className="task-cat"
            style={{ color: task.category_color || 'var(--text-dim)' }}
          >
            {task.category_name}
          </span>
        )}
        <span
          className={`task-due ${
            !task.due_date
              ? 'is-none'
              : overdue
              ? 'is-overdue'
              : today
              ? 'is-today'
              : ''
          }`}
        >
          {task.due_date
            ? new Date(task.due_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            : 'No date'}
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

export default TasksPage;
