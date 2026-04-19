import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  getTaskById,
  updateTask,
  deleteTask,
  getComments,
  addComment,
  deleteComment,
} from '../api/taskApi';
import { getCategories } from '../api/categoryApi';
import { errorMessage } from '../api/client';

const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

function toLocalInputFormat(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function relativeTime(iso) {
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

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();

  const [task, setTask] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const descTextareaRef = useRef(null);

  // Load task
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    getTaskById(id)
      .then((res) => {
        if (cancelled) return;
        setTask(res.data);
        setTitleDraft(res.data.title || '');
        setDescDraft(res.data.description || '');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 404) setNotFound(true);
        else setError(errorMessage(err, 'Could not load task.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id, isAuthenticated]);

  // Load comments when task lands
  useEffect(() => {
    if (!task) return;
    let cancelled = false;
    setCommentsLoading(true);
    getComments(id)
      .then((res) => { if (!cancelled) setComments(res.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCommentsLoading(false); });
    return () => { cancelled = true; };
  }, [id, task?.id]);

  // Load categories for the picker
  useEffect(() => {
    if (!isAuthenticated) return;
    getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
  }, [isAuthenticated]);

  async function patch(fields) {
    const prev = task;
    setTask((t) => ({ ...t, ...fields }));
    setSaving(true);
    try {
      const { data } = await updateTask(id, fields);
      setTask((t) => ({ ...t, ...data }));
    } catch (err) {
      console.error('[update task]', err);
      setTask(prev);
      alert(errorMessage(err, 'Could not save change.'));
    } finally {
      setSaving(false);
    }
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
      await deleteTask(id);
      navigate('/tasks');
    } catch (err) {
      console.error('[delete task]', err);
      alert(errorMessage(err, 'Could not delete task.'));
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    const content = commentDraft.trim();
    if (!content || posting) return;
    setPosting(true);
    try {
      const { data } = await addComment(id, { content });
      setComments((prev) => [data, ...prev]);
      setCommentDraft('');
    } catch (err) {
      console.error('[add comment]', err);
      alert(errorMessage(err, 'Could not post comment.'));
    } finally {
      setPosting(false);
    }
  }

  async function handleDeleteComment(c) {
    if (!window.confirm('Delete this comment?')) return;
    const before = comments;
    setComments((prev) => prev.filter((x) => x.id !== c.id));
    try {
      await deleteComment(id, c.id);
    } catch (err) {
      console.error('[delete comment]', err);
      setComments(before);
      alert(errorMessage(err, 'Could not delete comment.'));
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

  if (error) {
    return (
      <div className="td">
        <div className="td-back">
          <Link to="/tasks" className="dash-link">← Back to tasks</Link>
        </div>
        <p className="dash-empty dash-error">{error}</p>
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
          <span className="td-meta-dot">·</span>
          <span>Created {relativeTime(task.created_at)}</span>
          {task.updated_at && task.updated_at !== task.created_at && (
            <>
              <span className="td-meta-dot">·</span>
              <span>Updated {relativeTime(task.updated_at)}</span>
            </>
          )}
          {saving && (
            <>
              <span className="td-meta-dot">·</span>
              <span className="td-saving">Saving…</span>
            </>
          )}
          {!canEdit && (
            <>
              <span className="td-meta-dot">·</span>
              <span className="td-readonly">View only</span>
            </>
          )}
        </div>
      </header>

      {/* Status segmented control */}
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

      {/* Two-column */}
      <div className="td-grid">
        <div className="td-col-main">
          {/* Description */}
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

          {/* Comments */}
          <section className="td-card">
            <h3 className="td-card-title">
              Comments
              {comments.length > 0 && (
                <span className="td-count"> · {comments.length}</span>
              )}
            </h3>

            <form className="td-comment-form" onSubmit={handleAddComment}>
              <textarea
                className="td-comment-input"
                placeholder="Write a comment…"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={2}
                disabled={posting}
                maxLength={5000}
              />
              <button
                type="submit"
                className="td-comment-btn"
                disabled={!commentDraft.trim() || posting}
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </form>

            {commentsLoading ? (
              <div className="dash-skel td-skel-row" />
            ) : comments.length === 0 ? (
              <p className="dash-empty">Be the first to comment.</p>
            ) : (
              <ul className="td-comments">
                {comments.map((c) => {
                  const isAuthor = c.author_email && currentUserEmail &&
                    c.author_email === currentUserEmail;
                  return (
                    <li key={c.id} className="td-comment">
                      <div className="td-comment-avatar">
                        {c.author_avatar ? (
                          <img src={c.author_avatar} alt="" />
                        ) : (
                          <span>
                            {(c.author_name || c.author_email || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="td-comment-body-wrap">
                        <div className="td-comment-head">
                          <span className="td-comment-author">
                            {c.author_name || c.author_email || 'Unknown'}
                          </span>
                          <span className="td-comment-time">
                            {relativeTime(c.created_at)}
                          </span>
                          {isAuthor && (
                            <button
                              type="button"
                              className="td-comment-del"
                              onClick={() => handleDeleteComment(c)}
                              aria-label="Delete comment"
                              title="Delete"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <p className="td-comment-body">{c.content}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
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
                  category_id: e.target.value ? parseInt(e.target.value) : null,
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
