import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/categoryApi';
import { errorMessage } from '../api/client';
import { useToast } from '../hooks/useToast';

const PRESET_COLORS = [
  '#f97316', '#3b82f6', '#8b5cf6', '#10b981',
  '#14b8a6', '#ef4444', '#ec4899', '#eab308',
  '#22c55e', '#f43f5e', '#0ea5e9', '#a855f7',
];

function pickRandomColor() {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

function CategoryRow({ cat, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [color, setColor] = useState(cat.color);
  const [pending, setPending] = useState(false);

  useEffect(() => { setName(cat.name); setColor(cat.color); }, [cat.id]); // eslint-disable-line

  async function commit() {
    if (!name.trim()) {
      setName(cat.name);
      setEditing(false);
      return;
    }
    if (name.trim() === cat.name && color === cat.color) {
      setEditing(false);
      return;
    }
    setPending(true);
    try {
      await onSave(cat, { name: name.trim(), color });
      setEditing(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="cat-row">
      <label className="cat-swatch-wrap" aria-label="Pick color">
        <span className="cat-swatch" style={{ background: color }} />
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setEditing(true);
          }}
          aria-label={`Color for ${cat.name}`}
        />
      </label>

      {editing ? (
        <input
          className="cat-input cat-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
            if (e.key === 'Escape') {
              setName(cat.name);
              setColor(cat.color);
              setEditing(false);
            }
          }}
          maxLength={100}
          autoFocus
          disabled={pending}
        />
      ) : (
        <button
          type="button"
          className="cat-name-btn"
          onClick={() => setEditing(true)}
        >
          {cat.name}
        </button>
      )}

      <button
        type="button"
        className="cat-del"
        onClick={() => onDelete(cat)}
        aria-label={`Delete ${cat.name}`}
        title="Delete"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        </svg>
      </button>
    </li>
  );
}

function CategoriesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(() => pickRandomColor());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    getCategories()
      .then((res) => { if (!cancelled) setCategories(res.data || []); })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load categories.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  async function handleAdd(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      const res = await createCategory({ name, color: newColor });
      setCategories((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setNewColor(pickRandomColor());
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create category.'));
    } finally {
      setAdding(false);
    }
  }

  async function handleSave(cat, fields) {
    try {
      const res = await updateCategory(cat.id, fields);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? res.data : c))
        .sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save category.'));
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete “${cat.name}”? Tasks using it will be uncategorized.`)) return;
    const before = categories;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    try {
      await deleteCategory(cat.id);
    } catch (err) {
      setCategories(before);
      toast.error(errorMessage(err, 'Could not delete category.'));
    }
  }

  if (authLoading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="dash cat-page">
      <header className="cat-page-head">
        <p className="cal-page-eyebrow">
          <span className="cal-page-eyebrow-dot" />
          Workspace
        </p>
        <h1 className="cal-page-title">Categories</h1>
        <p className="cal-page-year">
          {loading ? '—' : `${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`}
        </p>
      </header>

      <form className="cat-add" onSubmit={handleAdd}>
        <label className="cat-swatch-wrap" aria-label="Pick color">
          <span className="cat-swatch" style={{ background: newColor }} />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            aria-label="New category color"
          />
        </label>
        <input
          className="cat-input cat-add-input"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a category — e.g. Project, Reading, Side hustle"
          maxLength={100}
          disabled={adding}
        />
        <button
          type="submit"
          className="btn-primary cat-add-btn"
          disabled={!newName.trim() || adding}
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>

      <div className="cat-presets">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`cat-preset ${c === newColor ? 'is-active' : ''}`}
            style={{ background: c }}
            onClick={() => setNewColor(c)}
            aria-label={`Use color ${c}`}
          />
        ))}
      </div>

      {error ? (
        <p className="dash-empty dash-error">{error}</p>
      ) : loading ? (
        <div className="dash-skel dash-skel-list" />
      ) : categories.length === 0 ? (
        <div className="tasks-empty">
          <p className="tasks-empty-title">No categories yet.</p>
          <p className="tasks-empty-sub">Add one above to start grouping your tasks.</p>
        </div>
      ) : (
        <ul className="cat-list">
          {categories.map((c) => (
            <CategoryRow key={c.id} cat={c} onSave={handleSave} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default CategoriesPage;
