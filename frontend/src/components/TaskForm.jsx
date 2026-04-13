import { useState } from 'react';
import { AIAssistantButton } from './AIAssistant.jsx';

const CATEGORIES = ['Work', 'Personal', 'Health', 'Shopping', 'Education', 'Other'];
const STATUSES = ['todo', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];
const RECURRING = ['none', 'daily', 'weekly', 'monthly'];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Work',
  status: 'todo',
  priority: 'medium',
  deadline: '',
  recurring: 'none',
};

function buildFormState(task) {
  if (!task) return EMPTY_FORM;
  return {
    title: task.title || '',
    description: task.description || '',
    category: task.category || 'Work',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    deadline: task.deadline || '',
    recurring: task.recurring || 'none',
  };
}

// Parent components should pass key={task?.id || 'new'} to reset state on task change.
export function TaskForm({ task, onSave, onClose }) {
  const [form, setForm] = useState(() => buildFormState(task));
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const handleAIApply = (suggestions) => {
    setForm(f => ({
      ...f,
      category: suggestions.category ?? f.category,
      priority: suggestions.priority ?? f.priority,
      deadline: suggestions.deadline ?? f.deadline,
      description: f.description?.trim() ? f.description : (suggestions.description ?? f.description),
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          {/* Title + AI Assist */}
          <div className="form-row form-row--stretch">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                className={`form-input${errors.title ? ' input-error' : ''}`}
                value={form.title}
                onChange={set('title')}
                placeholder="What needs to be done?"
                autoFocus
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>
            <AIAssistantButton
              title={form.title}
              description={form.description}
              onApply={handleAIApply}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              className="form-input form-textarea"
              value={form.description}
              onChange={set('description')}
              placeholder="Add details, steps, or notes…"
              rows={4}
            />
          </div>

          {/* Row: Category + Status */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input form-select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input form-select" value={form.status} onChange={set('status')}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s === 'todo' ? 'To Do' : s === 'in-progress' ? 'In Progress' : 'Completed'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Priority + Recurring */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input form-select" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Recurring</label>
              <select className="form-input form-select" value={form.recurring} onChange={set('recurring')}>
                {RECURRING.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input
              type="date"
              className="form-input"
              value={form.deadline}
              onChange={set('deadline')}
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
