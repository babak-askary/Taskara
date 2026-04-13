import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TaskContext.jsx';
import { CommentSection } from '../components/CommentSection.jsx';
import { formatDate, formatShortDate, formatFileSize, isOverdue } from '../utils/formatters.js';

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


export function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, updateTask, deleteTask, addComment, deleteComment, addAttachment, logTime } = useTasks();
  const task = tasks.find(t => t.id === id);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [logMinutes, setLogMinutes] = useState('');
  const [showTimeLog, setShowTimeLog] = useState(false);
  const fileInputRef = useRef(null);

  if (!task) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">😕</div>
          <h3>Task not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/tasks')}>Back to Tasks</button>
        </div>
      </div>
    );
  }

  const overdue = isOverdue(task.deadline, task.status);

  const startEdit = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      category: task.category,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline || '',
      recurring: task.recurring || 'none',
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateTask(task.id, editForm);
    setEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      deleteTask(task.id);
      navigate('/tasks');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => addAttachment(task.id, f));
    e.target.value = '';
  };

  const handleLogTime = () => {
    const mins = parseInt(logMinutes, 10);
    if (!mins || mins <= 0) return;
    logTime(task.id, mins);
    setLogMinutes('');
    setShowTimeLog(false);
  };

  const setField = (field) => (e) =>
    setEditForm(f => ({ ...f, [field]: e.target.value }));

  const totalMinutes = task.timeSpent || 0;
  const timeDisplay = totalMinutes
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    : '0m';

  return (
    <div className="page detail-page">
      {/* Back button */}
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="detail-layout">
        {/* Main content */}
        <div className="detail-main">
          {editing ? (
            /* ── Edit mode ── */
            <div className="edit-card">
              <h2 className="section-title">Editing Task</h2>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={editForm.title} onChange={setField('title')} />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" rows={5} value={editForm.description} onChange={setField('description')} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input form-select" value={editForm.category} onChange={setField('category')}>
                    {['Work','Personal','Health','Shopping','Education','Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input form-select" value={editForm.status} onChange={setField('status')}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input form-select" value={editForm.priority} onChange={setField('priority')}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Recurring</label>
                  <select className="form-input form-select" value={editForm.recurring} onChange={setField('recurring')}>
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input type="date" className="form-input" value={editForm.deadline} onChange={setField('deadline')} />
              </div>

              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="detail-card">
              {/* Status + priority badges */}
              <div className="detail-badges">
                <span className={`badge ${STATUS_META[task.status]?.cls}`}>{STATUS_META[task.status]?.label}</span>
                <span className={`badge ${PRIORITY_META[task.priority]?.cls}`}>{PRIORITY_META[task.priority]?.label}</span>
                {task.recurring !== 'none' && <span className="badge badge-recurring">🔁 {task.recurring}</span>}
                {overdue && <span className="badge badge-overdue">⚠️ Overdue</span>}
              </div>

              <h1 className="detail-title">{task.title}</h1>

              {task.description ? (
                <p className="detail-desc">{task.description}</p>
              ) : (
                <p className="detail-desc empty-desc">No description — <button className="link-btn" onClick={startEdit}>add one</button></p>
              )}

              {/* Action bar */}
              <div className="detail-actions">
                <button className="btn btn-secondary btn-sm" onClick={startEdit}>✏️ Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowTimeLog(t => !t)}>⏱ Log Time</button>
                <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>📎 Attach</button>
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} />
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️ Delete</button>
              </div>

              {/* Time logger */}
              {showTimeLog && (
                <div className="time-log-panel">
                  <label className="form-label">Log time (minutes)</label>
                  <div className="time-log-row">
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: 120 }}
                      placeholder="e.g. 30"
                      value={logMinutes}
                      onChange={e => setLogMinutes(e.target.value)}
                      min={1}
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleLogTime}>Add</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowTimeLog(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <CommentSection
            task={task}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
          />
        </div>

        {/* Sidebar */}
        <aside className="detail-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-heading">Details</h3>
            <dl className="detail-list">
              <dt>Category</dt>
              <dd>{task.category}</dd>
              <dt>Deadline</dt>
              <dd className={overdue ? 'text-danger' : ''}>{formatShortDate(task.deadline)}</dd>
              <dt>Time Spent</dt>
              <dd>{timeDisplay}</dd>
              <dt>Created</dt>
              <dd>{formatDate(task.createdAt)}</dd>
              <dt>Updated</dt>
              <dd>{formatDate(task.updatedAt)}</dd>
            </dl>
          </div>

          {/* Attachments */}
          <div className="sidebar-card">
            <div className="sidebar-heading-row">
              <h3 className="sidebar-heading">Attachments ({task.attachments?.length || 0})</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => fileInputRef.current?.click()}>+ Add</button>
            </div>
            {task.attachments?.length > 0 ? (
              <ul className="attachment-list">
                {task.attachments.map(a => (
                  <li key={a.id} className="attachment-item">
                    <span className="attachment-icon">📄</span>
                    <div className="attachment-info">
                      <span className="attachment-name">{a.name}</span>
                      <span className="attachment-size">{formatFileSize(a.size)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state-sm">No attachments</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
