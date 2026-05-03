import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createTask } from '../../api/taskApi';
import { getCategories } from '../../api/categoryApi';
import { errorMessage } from '../../api/client';
import { useFocusTrap } from '../../hooks/useFocusTrap';

// Format a Date as the value YYYY-MM-DDTHH:MM that <input type="datetime-local"> wants.
function toDatetimeLocal(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ANCHOR_GAP = 12;          // distance from the cursor
const ANCHOR_VIEWPORT_PAD = 12; // min distance from any viewport edge

function QuickCreateTask({ initialDate, onClose, onCreated, anchor, onDraftChange }) {
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState(() => toDatetimeLocal(initialDate));
  const [priority, setPriority] = useState('medium');
  const [estimated, setEstimated] = useState(60);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);

  // When an anchor (cursor position) is provided, position the dialog as a
  // popover next to the cursor, flipping/clamping so it always stays in the
  // viewport. If the viewport is too narrow we fall back to the centered
  // modal layout regardless of anchor.
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
    // Flip left if it would overflow right edge
    if (x + rect.width + ANCHOR_VIEWPORT_PAD > vw) {
      x = anchor.x - rect.width - ANCHOR_GAP;
    }
    // Flip up if it would overflow bottom edge
    if (y + rect.height + ANCHOR_VIEWPORT_PAD > vh) {
      y = anchor.y - rect.height - ANCHOR_GAP;
    }
    // Final clamp so we never go off-screen even if the dialog is huge
    x = Math.max(ANCHOR_VIEWPORT_PAD, Math.min(x, vw - rect.width - ANCHOR_VIEWPORT_PAD));
    y = Math.max(ANCHOR_VIEWPORT_PAD, Math.min(y, vh - rect.height - ANCHOR_VIEWPORT_PAD));
    setPos({ x, y });
  }, [useAnchor, anchor]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Push a live "draft" up to the parent every time the schedule fields change,
  // so the calendar can render a ghost preview block that moves and resizes
  // as the user edits. Title is included so the preview shows its label.
  useEffect(() => {
    if (!onDraftChange) return;
    const due = new Date(datetime);
    if (isNaN(due.getTime())) return;
    onDraftChange({
      title: title.trim() || 'New task',
      due_date: due.toISOString(),
      estimated_time: Number(estimated) || 60,
      priority,
    });
  }, [title, datetime, estimated, priority, onDraftChange]);

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
      const res = await createTask({
        title: title.trim(),
        priority,
        due_date: new Date(datetime).toISOString(),
        estimated_time: estimated ? Number(estimated) : undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not create the task.'));
    } finally {
      setSubmitting(false);
    }
  }

  const backdropClass = useAnchor ? 'qc-backdrop qc-backdrop-anchored' : 'qc-backdrop';
  const modalClass = useAnchor ? 'qc-modal qc-modal-anchored' : 'qc-modal';
  const anchorStyle = useAnchor && pos
    ? { top: `${pos.y}px`, left: `${pos.x}px`, opacity: 1 }
    : useAnchor
      ? { opacity: 0 } // Hide for first paint while we measure
      : null;

  return (
    <div className={backdropClass} onClick={onClose}>
      <div
        ref={dialogRef}
        className={modalClass}
        role="dialog"
        aria-modal="true"
        aria-label="Create task"
        style={anchorStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="qc-head">
          <p className="qc-eyebrow">New task</p>
          <h3 className="qc-title">Add to your calendar</h3>
        </header>

        <form className="qc-form" onSubmit={submit}>
          <label className="qc-field qc-field-full">
            <span className="qc-label">Title</span>
            <input
              className="qc-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              maxLength={255}
              autoFocus
              required
            />
          </label>

          <label className="qc-field">
            <span className="qc-label">When</span>
            <input
              className="qc-input"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
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
            <span className="qc-label">Priority</span>
            <select
              className="qc-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
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

          {error && <p className="qc-error">{error}</p>}

          <div className="qc-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !title.trim()}>
              {submitting ? 'Creating…' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickCreateTask;
