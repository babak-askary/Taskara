import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateTask } from '../../api/taskApi';
import { getCategories } from '../../api/categoryApi';
import { errorMessage } from '../../api/client';
import { useFocusTrap } from '../../hooks/useFocusTrap';

function toDatetimeLocal(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ANCHOR_GAP = 12;
const ANCHOR_VIEWPORT_PAD = 12;

function QuickEditTask({ task, anchor, onClose, onSaved }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState(task.title || '');
  const [status, setStatus] = useState(task.status || 'todo');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [datetime, setDatetime] = useState(() =>
    task.due_date ? toDatetimeLocal(new Date(task.due_date)) : ''
  );
  const [estimated, setEstimated] = useState(task.estimated_time || 60);
  const [categoryId, setCategoryId] = useState(task.category_id || '');
  const [recurrence, setRecurrence] = useState(task.recurrence_rule || '');
  const [description, setDescription] = useState(task.description || '');

  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);

  const isMobile = typeof window !== 'undefined'
    && window.matchMedia('(max-width: 720px)').matches;
  const useAnchor = !!anchor && !isMobile;

  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    if (!useAnchor || !dialogRef.current) {
      setPos(null);
      return;
    }
    const rect = dialogRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = anchor.x + ANCHOR_GAP;
    let y = anchor.y + ANCHOR_GAP;
    if (x + rect.width + ANCHOR_VIEWPORT_PAD > vw) x = anchor.x - rect.width - ANCHOR_GAP;
    if (y + rect.height + ANCHOR_VIEWPORT_PAD > vh) y = anchor.y - rect.height - ANCHOR_GAP;
    x = Math.max(ANCHOR_VIEWPORT_PAD, Math.min(x, vw - rect.width - ANCHOR_VIEWPORT_PAD));
    y = Math.max(ANCHOR_VIEWPORT_PAD, Math.min(y, vh - rect.height - ANCHOR_VIEWPORT_PAD));
    setPos({ x, y });
  }, [useAnchor, anchor]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        status,
        priority,
        estimated_time: estimated ? Number(estimated) : null,
        category_id: categoryId ? Number(categoryId) : null,
        description: description.trim() || null,
        is_recurring: !!recurrence,
        recurrence_rule: recurrence || null,
      };
      if (datetime) payload.due_date = new Date(datetime).toISOString();
      const res = await updateTask(task.id, payload);
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not save changes.'));
    } finally {
      setSubmitting(false);
    }
  }

  const backdropClass = useAnchor ? 'qc-backdrop qc-backdrop-anchored' : 'qc-backdrop';
  const modalClass = useAnchor
    ? 'qc-modal qc-modal-anchored qe-modal'
    : 'qc-modal qe-modal';
  const anchorStyle = useAnchor && pos
    ? { top: `${pos.y}px`, left: `${pos.x}px`, opacity: 1 }
    : useAnchor
      ? { opacity: 0 }
      : null;

  return (
    <div className={backdropClass} onClick={onClose}>
      <div
        ref={dialogRef}
        className={modalClass}
        role="dialog"
        aria-modal="true"
        aria-label="Edit task"
        style={anchorStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="qc-head qe-head">
          <p className="qc-eyebrow">Edit task</p>
          <input
            className="qe-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            placeholder="Task title"
          />
        </header>

        <form className="qc-form qe-form" onSubmit={submit}>
          <div className="qc-field qc-field-full">
            <span className="qc-label">Status</span>
            <div className="qe-segmented" role="radiogroup" aria-label="Status">
              {[
                { v: 'todo', label: 'To do' },
                { v: 'in_progress', label: 'In progress' },
                { v: 'done', label: 'Done' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  role="radio"
                  aria-checked={status === opt.v}
                  className={`qe-seg ${status === opt.v ? 'is-active' : ''} qe-seg-${opt.v.replace('_', '-')}`}
                  onClick={() => setStatus(opt.v)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="qc-field qc-field-full">
            <span className="qc-label">Priority</span>
            <div className="qe-segmented" role="radiogroup" aria-label="Priority">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={priority === p}
                  className={`qe-seg qe-seg-pri qe-seg-pri-${p} ${priority === p ? 'is-active' : ''}`}
                  onClick={() => setPriority(p)}
                >
                  {p[0].toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <label className="qc-field">
            <span className="qc-label">When</span>
            <input
              className="qc-input"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
          </label>

          <label className="qc-field">
            <span className="qc-label">Duration (min)</span>
            <input
              className="qc-input"
              type="number"
              min="5"
              step="5"
              value={estimated}
              onChange={(e) => setEstimated(e.target.value)}
            />
          </label>

          <label className="qc-field">
            <span className="qc-label">Category</span>
            <select
              className="qc-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className="qc-field">
            <span className="qc-label">Repeats</span>
            <select
              className="qc-input"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
            >
              <option value="">Doesn't repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          <label className="qc-field qc-field-full">
            <span className="qc-label">Description</span>
            <textarea
              className="qc-input qe-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a note…"
            />
          </label>

          {error && <p className="qc-error">{error}</p>}

          <div className="qc-actions qe-actions">
            <button
              type="button"
              className="qe-link-btn"
              onClick={() => { onClose(); navigate(`/tasks/${task.id}`); }}
            >
              Open full view →
            </button>
            <div className="qe-actions-right">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting || !title.trim()}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickEditTask;
