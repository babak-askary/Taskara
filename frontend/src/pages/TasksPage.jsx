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
import apiClient, { errorMessage } from '../api/client';
import { onSocketEvent } from '../services/socket';
import DueDatePicker from '../components/common/DueDatePicker';
import FiltersBar from '../components/tasks/FiltersBar';
import TaskRow from '../components/tasks/TaskRow';
import { isOverdue } from '../utils/dateFormat';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { useToast } from '../hooks/useToast';

function TasksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = useTaskFilters();
  const { status, priority, categoryId, sort, search, hasFilters, searchInput, setSearchInput, setStatus, setPriority, setCategoryId, setSort, clear } = filters;

  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingTitle, setPendingTitle] = useState('');

  // Categories (loaded once)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getCategories()
      .then((res) => { if (!cancelled) setCategories(res.data || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Live updates: a task gets shared with me, or I'm removed from one
  useEffect(() => {
    if (!isAuthenticated) return;
    const offShared = onSocketEvent('task:shared', (incoming) => {
      if (!incoming?.id) return;
      setTasks((prev) => (
        prev.find((t) => t.id === incoming.id) ? prev : [incoming, ...prev]
      ));
    });
    const offUnshared = onSocketEvent('task:unshared', ({ task_id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== task_id));
    });
    return () => { offShared(); offUnshared(); };
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

    const call = search ? searchTasks({ ...params, q: search }) : getTasks(params);

    call
      .then((res) => { if (!cancelled) setTasks(res.data || []); })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load tasks.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated, status, priority, categoryId, sort, search]);

  // People search for collaboration/sharing hints
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!search) {
      setPeople([]);
      setPeopleLoading(false);
      setPeopleError(null);
      return;
    }
    let cancelled = false;
    setPeopleLoading(true);
    setPeopleError(null);
    apiClient
      .get('/users', { params: { search, limit: 8 } })
      .then((res) => { if (!cancelled) setPeople(res.data || []); })
      .catch((err) => {
        if (!cancelled) {
          setPeople([]);
          setPeopleError(errorMessage(err, 'Could not search people.'));
        }
      })
      .finally(() => { if (!cancelled) setPeopleLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, search]);

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
      toast.error(errorMessage(err, 'Could not create task.'));
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
      const res = await updateTask(task.id, { status: next });
      const { spawned, ...rest } = res.data || {};
      setTasks((list) => {
        let out = list.map((t) => (t.id === rest.id ? { ...t, ...rest } : t));
        // The backend spawns the next instance when a recurring task is
        // marked done. Prepend it locally so it appears immediately.
        if (spawned?.id && !out.some((t) => t.id === spawned.id)) {
          out = [spawned, ...out];
        }
        return out;
      });
      if (spawned?.id) {
        toast.success(`Next “${spawned.title}” scheduled.`);
      }
    } catch (err) {
      setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: prev } : t)));
      toast.error(errorMessage(err, 'Could not update task.'));
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    const before = tasks;
    setTasks((list) => list.filter((t) => t.id !== task.id));
    try {
      await deleteTask(task.id);
    } catch (err) {
      setTasks(before);
      toast.error(errorMessage(err, 'Could not delete task.'));
    }
  }

  if (authLoading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

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

      <FiltersBar
        searchInput={searchInput} setSearchInput={setSearchInput}
        status={status} setStatus={setStatus}
        priority={priority} setPriority={setPriority}
        categoryId={categoryId} setCategoryId={setCategoryId}
        sort={sort} setSort={setSort}
        categories={categories}
        hasFilters={hasFilters} onClear={clear}
      />

      <DueDatePicker
        isOpen={pickerOpen}
        taskTitle={pendingTitle}
        onConfirm={(iso) => createPendingTask(iso)}
        onSkip={() => createPendingTask(null)}
        onClose={handlePickerCancel}
      />

      {search && (
        <section className="dash-card" style={{ marginBottom: '1rem' }}>
          <header className="dash-card-head dash-card-head-row">
            <div>
              <p className="dash-card-eyebrow">People</p>
              <h3 className="dash-card-title">Matching users</h3>
            </div>
          </header>

          {peopleLoading ? (
            <p className="dash-empty">Searching people...</p>
          ) : peopleError ? (
            <p className="dash-empty dash-error">{peopleError}</p>
          ) : people.length === 0 ? (
            <p className="dash-empty">No people match your search.</p>
          ) : (
            <ul className="dash-cat-list">
              {people.map((p) => (
                <li key={p.id} className="dash-cat-row">
                  <span className="dash-cat-dot" style={{ background: '#6b7280' }} />
                  <span className="dash-cat-name">{p.name || 'Unnamed user'}</span>
                  <span className="dash-cat-count">{p.email}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

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

export default TasksPage;
