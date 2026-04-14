import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const STORAGE_KEY = 'taskara.tasks';

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Work',
  priority: 'medium',
  dueDate: '',
};

function loadTasks() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function TasksPage() {
  const { user } = useAuth0();
  const [tasks, setTasks] = useState(loadTasks);
  const [query, setQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isFormOpen) {
      previousFocusRef.current = document.activeElement;
      const focusable = dialogRef.current?.querySelector(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isFormOpen]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const editingTask = useMemo(() => tasks.find((task) => task.id === editingTaskId), [tasks, editingTaskId]);

  const knownUsers = useMemo(() => {
    const seen = new Map();

    if (user) {
      seen.set(user.sub || user.email || user.name, {
        id: user.sub || user.email || user.name,
        name: user.name || 'Current User',
        email: user.email || '',
      });
    }

    tasks.forEach((task) => {
      if (!task.creator) {
        return;
      }

      const key = task.creator.id || task.creator.email || task.creator.name;

      if (!key || seen.has(key)) {
        return;
      }

      seen.set(key, {
        id: key,
        name: task.creator.name || 'Unknown',
        email: task.creator.email || '',
      });
    });

    return Array.from(seen.values());
  }, [tasks, user]);

  const visibleUsers = useMemo(() => {
    const normalizedQuery = userQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return knownUsers;
    }

    return knownUsers.filter((person) =>
      [person.name, person.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [knownUsers, userQuery]);

  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...tasks].filter((task) => {
      if (creatorFilter && task.creator?.id !== creatorFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [task.title, task.description, task.category, task.priority, task.creator?.name, task.creator?.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [tasks, query, creatorFilter]);

  const openNewTask = () => {
    setEditingTaskId(null);
    setFormData(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'Work',
      priority: task.priority || 'medium',
      dueDate: task.dueDate || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTaskId(null);
    setFormData(EMPTY_FORM);
  };

  const handleDialogKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeForm();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const title = formData.title.trim();

    if (!title) {
      return;
    }

    const nextTask = {
      id: editingTaskId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      description: formData.description.trim(),
      category: formData.category,
      priority: formData.priority,
      dueDate: formData.dueDate,
      status: editingTaskId ? editingTask?.status || 'todo' : 'todo',
      creator: editingTaskId
        ? editingTask?.creator || { id: user?.sub || 'local-user', name: user?.name || 'Member', email: user?.email || '' }
        : {
            id: user?.sub || 'local-user',
            name: user?.name || 'Member',
            email: user?.email || '',
          },
      updatedAt: new Date().toISOString(),
      createdAt: editingTaskId ? editingTask?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    setTasks((currentTasks) => {
      if (editingTaskId) {
        return currentTasks.map((task) => (task.id === editingTaskId ? nextTask : task));
      }

      return [nextTask, ...currentTasks];
    });

    closeForm();
  };

  const toggleComplete = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'completed' ? 'todo' : 'completed',
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    );
  };

  const deleteTask = (taskId) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  };

  return (
    <section className="board-page fade-up">
      <header className="page-head">
        <div>
          <p className="eyebrow">Workspace Board</p>
          <h1>Tasks</h1>
          <p className="lead">Add, edit, and complete tasks.</p>
        </div>

        <button className="btn btn-solid" type="button" onClick={openNewTask}>
          New Task
        </button>
      </header>

      <article className="card-surface board-toolbar">
        <div className="board-toolbar-grid">
          <input
            className="board-input"
            type="search"
            placeholder="Search tasks"
            aria-label="Search tasks"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <input
            className="board-input"
            type="search"
            placeholder="Search users"
            aria-label="Search users"
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
          />
        </div>

        {visibleUsers.length ? (
          <div className="user-filter-row">
            <button
              className={`btn btn-outline ${creatorFilter ? '' : 'active-filter'}`}
              type="button"
              onClick={() => setCreatorFilter('')}
            >
              All users
            </button>
            {visibleUsers.map((person) => (
              <button
                key={person.id}
                className={`btn btn-outline ${creatorFilter === person.id ? 'active-filter' : ''}`}
                type="button"
                onClick={() => setCreatorFilter(person.id)}
                title={person.email || person.name}
              >
                {person.name}
              </button>
            ))}
          </div>
        ) : null}
      </article>

      {isFormOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closeForm}>
          <article
            ref={dialogRef}
            className="card-surface modal-panel modal-panel-enhanced"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-editor-title"
            onKeyDown={handleDialogKeyDown}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="task-form-head">
              <div>
                <p className="eyebrow">Task Editor</p>
                <h2 id="task-editor-title">{editingTaskId ? 'Edit Task' : 'New Task'}</h2>
                <p className="lead">Fill in details and save.</p>
              </div>
            </div>

            <div className="task-helper-row">
              <span className="task-helper-chip">Owner: {user?.name || 'Member'}</span>
              <span className="task-helper-chip">Status: {editingTask?.status === 'completed' ? 'Done' : 'Open'}</span>
            </div>

            <form className="task-form" onSubmit={handleSubmit}>
              <section className="task-form-section">
                <label>
                  Title
                  <input
                    className="board-input"
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    placeholder="Task title"
                  />
                </label>

                <label>
                  Description
                  <textarea
                    className="board-input"
                    rows="4"
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    placeholder="Short note"
                  />
                </label>
              </section>

              <section className="task-form-section">
                <div className="task-form-row">
                  <label>
                    Category
                    <select
                      className="board-input"
                      value={formData.category}
                      onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                    >
                      <option>Work</option>
                      <option>Personal</option>
                      <option>Health</option>
                      <option>Shopping</option>
                      <option>Education</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label>
                    Priority
                    <select
                      className="board-input"
                      value={formData.priority}
                      onChange={(event) => setFormData({ ...formData, priority: event.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>

                  <label>
                    Due date
                    <input
                      className="board-input"
                      type="date"
                      value={formData.dueDate}
                      onChange={(event) => setFormData({ ...formData, dueDate: event.target.value })}
                    />
                  </label>
                </div>
              </section>

              <div className="task-form-actions">
                <button className="btn btn-outline" type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button className="btn btn-solid" type="submit">
                  Save
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      <article className="card-surface empty-board">
        <div className="empty-badge" aria-hidden="true">T</div>
        <h2>{visibleTasks.length ? `${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'}` : 'No tasks yet'}</h2>
        <p>{visibleTasks.length ? 'Use the buttons on each card.' : 'Create one to start.'}</p>
      </article>

      {visibleTasks.length ? (
        <section className="task-list-grid">
          {visibleTasks.map((task) => (
            <article key={task.id} className={`card-surface task-card ${task.status === 'completed' ? 'task-card-complete' : ''}`}>
              <div className="task-card-top">
                <div>
                  <h3>{task.title}</h3>
                  <p className="task-card-subtitle">{task.category}</p>
                </div>
                <span className="status-chip">{task.status === 'completed' ? 'Done' : 'Open'}</span>
              </div>

              <p className="task-creator">By {task.creator?.name || 'Unknown'}</p>

              {task.description ? <p className="task-card-desc">{task.description}</p> : null}

              <div className="task-card-meta">
                <span>{task.priority}</span>
                <span>{task.dueDate || 'No due date'}</span>
              </div>

              <div className="task-card-actions">
                <button className="btn btn-outline" type="button" onClick={() => toggleComplete(task.id)}>
                  {task.status === 'completed' ? 'Reopen' : 'Done'}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => openEditTask(task)}>
                  Edit
                </button>
                <button className="btn btn-outline" type="button" onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </section>
  );
}

export default TasksPage;