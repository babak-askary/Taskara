import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, Navigate } from 'react-router-dom';
import {
  listMyGroups,
  searchGroups,
  createGroup,
  joinGroup,
} from '../api/groupApi';
import { errorMessage } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../hooks/useToast';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function GroupsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const toast = useToast();

  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create-form state
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    listMyGroups()
      .then((res) => { if (!cancelled) setMine(res.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchGroups(search.trim())
      .then((res) => { if (!cancelled) setResults(res.data || []); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [search]);

  // Auto-derive a slug from the name until the user types in the slug field.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  async function handleCreate(e) {
    e.preventDefault();
    if (creating || !name.trim() || !SLUG_RE.test(slug)) return;
    setCreating(true);
    try {
      const res = await createGroup({
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
      });
      setMine((prev) => [...prev, { ...res.data, role: 'owner', member_count: 1 }]
        .sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      setName(''); setSlug(''); setSlugTouched(false); setDescription('');
      toast.success(`“${res.data.name}” created.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create the group.'));
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(g) {
    try {
      await joinGroup(g.id);
      toast.success(`Joined “${g.name}”.`);
      const res = await listMyGroups();
      setMine(res.data || []);
      setResults((prev) => prev.map((r) => (r.id === g.id ? { ...r, is_member: true } : r)));
    } catch (err) {
      toast.error(errorMessage(err, 'Could not join the group.'));
    }
  }

  if (authLoading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const slugIsValid = slug && SLUG_RE.test(slug);

  return (
    <div className="dash gp">
      <header className="cal-page-head">
        <div className="cal-page-headline">
          <p className="cal-page-eyebrow">
            <span className="cal-page-eyebrow-dot" />
            Workspace
          </p>
          <h1 className="cal-page-title">Group projects</h1>
          <p className="cal-page-year">
            {loading ? '—' : `${mine.length} ${mine.length === 1 ? 'group' : 'groups'}`}
          </p>
        </div>
        <div className="cal-page-controls">
          <button className="cal-new-btn" onClick={() => setShowCreate((v) => !v)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{showCreate ? 'Cancel' : 'New group'}</span>
          </button>
        </div>
      </header>

      {showCreate && (
        <form className="gp-create" onSubmit={handleCreate}>
          <div className="qc-field qc-field-full">
            <label className="qc-label">Group name</label>
            <input
              className="qc-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Frontend Group — Morning"
              maxLength={120}
              autoFocus
              required
            />
          </div>
          <div className="qc-field qc-field-full">
            <label className="qc-label">Slug (others use this to find you)</label>
            <input
              className="qc-input gp-slug-input"
              value={slug}
              onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugTouched(true); }}
              placeholder="frontend-group-morning"
              maxLength={60}
              required
            />
            {slug && !slugIsValid && (
              <p className="gp-hint gp-hint-bad">
                Slug must be 3–60 chars: lowercase letters, numbers, and hyphens (no leading/trailing hyphen).
              </p>
            )}
          </div>
          <div className="qc-field qc-field-full">
            <label className="qc-label">Description (optional)</label>
            <textarea
              className="qc-input qe-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What is this group working on?"
            />
          </div>
          <div className="qc-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={creating || !name.trim() || !slugIsValid}>
              {creating ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </form>
      )}

      <section className="gp-search">
        <label className="qc-label" htmlFor="gp-search-input">Find a group</label>
        <input
          id="gp-search-input"
          className="qc-input"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by slug or name…"
        />
        {search.trim() && (
          <div className="gp-search-results">
            {searching ? (
              <p className="dash-empty">Searching…</p>
            ) : results.length === 0 ? (
              <p className="dash-empty">No groups match “{search}”.</p>
            ) : (
              <ul className="gp-list gp-list-search">
                {results.map((g) => (
                  <li key={g.id} className="gp-card">
                    <div className="gp-card-body">
                      <div className="gp-card-head">
                        <Link to={`/groups/${g.id}`} className="gp-card-name">{g.name}</Link>
                        <span className="gp-slug">{g.slug}</span>
                      </div>
                      {g.description && <p className="gp-card-desc">{g.description}</p>}
                      <p className="gp-card-meta">{g.member_count} member{g.member_count === 1 ? '' : 's'}</p>
                    </div>
                    <div className="gp-card-actions">
                      {g.is_member ? (
                        <Link to={`/groups/${g.id}`} className="btn-secondary">Open</Link>
                      ) : (
                        <button type="button" className="btn-primary" onClick={() => handleJoin(g)}>Join</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="gp-section">
        <h2 className="gp-section-title">Your groups</h2>
        {loading ? (
          <div className="dash-skel dash-skel-list" />
        ) : mine.length === 0 ? (
          <div className="tasks-empty">
            <p className="tasks-empty-title">You're not in any group yet.</p>
            <p className="tasks-empty-sub">Create one above, or search for a group's slug to join.</p>
          </div>
        ) : (
          <ul className="gp-list">
            {mine.map((g) => (
              <li key={g.id} className="gp-card">
                <div className="gp-card-body">
                  <div className="gp-card-head">
                    <Link to={`/groups/${g.id}`} className="gp-card-name">{g.name}</Link>
                    <span className="gp-slug">{g.slug}</span>
                    <span className={`gp-role gp-role-${g.role}`}>{g.role}</span>
                  </div>
                  {g.description && <p className="gp-card-desc">{g.description}</p>}
                  <p className="gp-card-meta">{g.member_count} member{g.member_count === 1 ? '' : 's'}</p>
                </div>
                <div className="gp-card-actions">
                  <Link to={`/groups/${g.id}`} className="btn-secondary">Open</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default GroupsPage;
