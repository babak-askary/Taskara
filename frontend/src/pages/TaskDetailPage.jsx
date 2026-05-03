import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getCategories } from '../api/categoryApi';
import { joinTask, leaveTask, onSocketEvent } from '../services/socket';
import ShareTaskPanel from '../components/tasks/ShareTaskPanel';
import TimeTracker from '../components/tasks/TimeTracker';
import AttachmentList from '../components/tasks/AttachmentList';
import CommentSection from '../components/tasks/CommentSection';
import { relativeTime } from '../utils/dateFormat';
import { STATUSES } from '../constants/taskOptions';
import { useTaskEditor } from '../hooks/useTaskEditor';
import { useToast } from '../hooks/useToast';

function toLocalInputFormat(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const toast = useToast();

  const editor = useTaskEditor(id, isAuthenticated);
  const { task, loading, loadError, notFound, saving, spawnedNotice, dismissSpawnNotice, applyExternal } = editor;

  const [categories, setCategories] = useState([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const descTextareaRef = useRef(null);

  // Sync drafts when the task loads or changes externally
  useEffect(() => {
    if (!task) return;
    setTitleDraft(task.title || '');
    setDescDraft(task.description || '');
  }, [task?.id]);

  // Categories for the picker
  useEffect(() => {
    if (!isAuthenticated) return;
    getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
  }, [isAuthenticated]);

  // Live updates for this task
  useEffect(() => {
    if (!isAuthenticated || !task?.id) return;
    const taskId = task.id;
    joinTask(taskId);

    const offUpdated = onSocketEvent('task:updated', (incoming) => {
      if (incoming?.id === taskId) applyExternal(incoming);
    });
    const offDeleted = onSocketEvent('task:deleted', ({ task_id }) => {
      if (task_id === taskId) navigate('/tasks');
    });

    return () => {
      offUpdated();
      offDeleted();
      leaveTask(taskId);
    };
  }, [isAuthenticated, task?.id, navigate, applyExternal]);

  async function patch(fields) {
    const errMsg = await editor.patch(fields);
    if (errMsg) toast.error(errMsg);
  }

  function commitTitle() {
    const t = titleDraft.trim();
    setEditingTitle(false);
    if (!t) {
      setTitleDraft(task.title);
      return;
    }
    if (t !== task.title) patch({ title: t });
  }

  function commitDesc() {
    const d = descDraft.trim();
    setEditingDesc(false);
    if (d !== (task.description || '')) {
      patch({ description: d || null });
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete “${task.title}”? This can't be undone.`)) return;
    try {
      await editor.remove();
      navigate('/tasks');
    } catch (err) {
      toast.error('Could not delete task.');
    }
  }

  if (authLoading) return <div className="loading">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="td">
        <div className="td-back">
          <Link to="/tasks" className="dash-link">← Back to tasks</Link>
        </div>
        <div className="dash-skel td-skel-hero" />
        <div className="dash-skel td-skel-body" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="td">
        <div className="td-back">
          <Link to="/tasks" className="dash-link">← Back to tasks</Link>
        </div>
        <div className="tasks-empty">
          <p className="tasks-empty-title">Task not found</p>
          <p className="tasks-empty-sub">It may have been deleted, or you don't have access.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="td">
        <div className="td-back">
          <Link to="/tasks" className="dash-link">← Back to tasks</Link>
        </div>
        <p className="dash-empty dash-error">{loadError}</p>
      </div>
    );
  }

  const canEdit = task.user_permission !== 'view';
  const currentUserEmail = user?.email;

  return (
    <div className="td">
      <div className="td-back">
        <Link to="/tasks" className="dash-link">← Back to tasks</Link>
      </div>

      <header className="td-header">
        {editingTitle && canEdit ? (
          <input
            className="td-title-input"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
              if (e.key === 'Escape') {
                setTitleDraft(task.title);
                setEditingTitle(false);
              }
            }}
            autoFocus
            maxLength={255}
          />
        ) : (
          <h1
            className={`td-title ${canEdit ? 'is-editable' : ''}`}
            onClick={() => canEdit && setEditingTitle(true)}
            title={canEdit ? 'Click to edit' : ''}
          >
            {task.title}
          </h1>
        )}

        <div className="td-meta">
          <span>By {task.owner_name || 'Unknown'}</span>
          <span className="td-meta-dot" aria-hidden="true">·</span>
          <span>Created {relativeTime(task.created_at)}</span>
          {task.updated_at && task.updated_at !== task.created_at && (
            <>
              <span className="td-meta-dot" aria-hidden="true">·</span>
              <span>Updated {relativeTime(task.updated_at)}</span>
            </>
          )}
          {saving && (
            <>
              <span className="td-meta-dot" aria-hidden="true">·</span>
              <span className="td-saving">Saving…</span>
            </>
          )}
          {!canEdit && (
            <>
              <span className="td-meta-dot" aria-hidden="true">·</span>
              <span className="td-readonly">View only</span>
            </>
          )}
        </div>
      </header>

      {spawnedNotice && (
        <div className="td-spawn-notice" role="status">
          <span aria-hidden="true">↻</span>
          <span>
            Repeat created — next instance is due{' '}
            {spawnedNotice.due_date
              ? new Date(spawnedNotice.due_date).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric',
                })
              : 'soon'}
            .{' '}
            <Link to={`/tasks/${spawnedNotice.id}`}>Open it.</Link>
          </span>
          <button
            type="button"
            className="td-spawn-close"
            aria-label="Dismiss"
            onClick={dismissSpawnNotice}
          >
            ×
          </button>
        </div>
      )}

      <section className="td-status">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`td-status-btn ${task.status === s.value ? `is-active is-${s.value}` : ''}`}
            onClick={() => {
              if (!canEdit || task.status === s.value) return;
              patch({ status: s.value });
            }}
            disabled={!canEdit}
          >
            {s.label}
          </button>
        ))}
      </section>

      <div className="td-grid">
        <div className="td-col-main">
          <section className="td-card">
            <h3 className="td-card-title">Description</h3>
            {editingDesc && canEdit ? (
              <textarea
                ref={descTextareaRef}
                className="td-desc-input"
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={commitDesc}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setDescDraft(task.description || '');
                    setEditingDesc(false);
                  }
                }}
                autoFocus
                rows={5}
                placeholder="Add a description…"
              />
            ) : task.description ? (
              <p
                className={`td-desc ${canEdit ? 'is-editable' : ''}`}
                onClick={() => canEdit && setEditingDesc(true)}
                title={canEdit ? 'Click to edit' : ''}
              >
                {task.description}
              </p>
            ) : (
              <button
                type="button"
                className="td-desc-placeholder"
                onClick={() => canEdit && setEditingDesc(true)}
                disabled={!canEdit}
              >
                {canEdit ? 'Add a description…' : 'No description.'}
              </button>
            )}
          </section>

          <AttachmentList
            taskId={task.id}
            canEdit={canEdit}
            currentUserEmail={currentUserEmail}
          />

          <CommentSection
            taskId={task.id}
            currentUserEmail={currentUserEmail}
          />
        </div>

        <aside className="td-col-side">
          <div className="td-card td-details">
            <h3 className="td-card-title">Details</h3>

            <div className="td-field">
              <label className="td-label">Priority</label>
              <select
                className="td-select"
                value={task.priority || ''}
                onChange={(e) => patch({ priority: e.target.value || null })}
                disabled={!canEdit}
              >
                <option value="">No priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="td-field">
              <label className="td-label">Category</label>
              <select
                className="td-select"
                value={task.category_id || ''}
                onChange={(e) => patch({
                  category_id: e.target.value ? parseInt(e.target.value, 10) : null,
                })}
                disabled={!canEdit}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="td-field">
              <label className="td-label">Due date</label>
              <input
                className="td-input"
                type="datetime-local"
                value={toLocalInputFormat(task.due_date)}
                onChange={(e) => patch({
                  due_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                })}
                disabled={!canEdit}
              />
            </div>

            <div className="td-field">
              <label className="td-label" htmlFor="td-estimate">Estimated minutes</label>
              <input
                id="td-estimate"
                className="td-input"
                type="number"
                min="0"
                max="100000"
                placeholder="e.g. 60"
                value={task.estimated_time ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  patch({ estimated_time: v === '' ? null : parseInt(v, 10) });
                }}
                disabled={!canEdit}
              />
            </div>

            <div className="td-field">
              <label className="td-label" htmlFor="td-repeat">Repeats</label>
              <select
                id="td-repeat"
                className="td-select"
                value={task.is_recurring ? (task.recurrence_rule || '') : ''}
                onChange={(e) => {
                  const rule = e.target.value;
                  if (!rule) {
                    patch({ is_recurring: false, recurrence_rule: null });
                  } else {
                    patch({ is_recurring: true, recurrence_rule: rule });
                  }
                }}
                disabled={!canEdit}
              >
                <option value="">Doesn't repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <p className="td-hint">When marked done, a new instance is created with the next due date.</p>
            </div>

            {task.category_name && (
              <div className="td-field-display">
                <span className="td-label">Current category</span>
                <span
                  className="td-display-value"
                  style={{ color: task.category_color || 'var(--text-dim)' }}
                >
                  {task.category_name}
                </span>
              </div>
            )}
          </div>

          <TimeTracker
            task={task}
            canEdit={canEdit}
            onTaskChange={(updated) => applyExternal(updated)}
          />

          {task.user_permission === 'owner' && (
            <ShareTaskPanel taskId={task.id} />
          )}

          {canEdit && (
            <button type="button" className="td-delete-btn" onClick={handleDelete}>
              Delete this task
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

export default TaskDetailPage;
