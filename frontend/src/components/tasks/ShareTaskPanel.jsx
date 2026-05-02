import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api/client';
import { getShares, shareTask, unshareTask } from '../../api/taskShareApi';
import { searchUsers } from '../../api/userApi';

function ShareTaskPanel({ taskId }) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [permission, setPermission] = useState('view');
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState(null);
  const inputRef = useRef(null);

  // Load existing shares
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    getShares(taskId)
      .then((res) => {
        if (cancelled) return;
        setShares(res.data || []);
        setLoadError(null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, 'Could not load shares.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [taskId]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Search users when debounced query changes
  useEffect(() => {
    if (!debounced) return;
    let cancelled = false;
    searchUsers(debounced)
      .then((res) => {
        if (cancelled) return;
        const sharedIds = new Set(shares.map((s) => s.user_id));
        setResults((res.data || []).filter((u) => !sharedIds.has(u.id)));
      })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debounced, shares]);

  function handleQueryChange(e) {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
    } else {
      setSearching(true);
    }
  }

  async function handleAdd(targetUser) {
    if (adding) return;
    setActionError(null);
    setAdding(true);
    try {
      await shareTask(taskId, { user_id: targetUser.id, permission });
      const res = await getShares(taskId);
      setShares(res.data || []);
      setQuery('');
      setDebounced('');
      setResults([]);
      inputRef.current?.focus();
    } catch (err) {
      setActionError(errorMessage(err, 'Could not share task.'));
    } finally {
      setAdding(false);
    }
  }

  async function handleRevoke(share) {
    if (!window.confirm(`Remove ${share.name || share.email}'s access?`)) return;
    setActionError(null);
    const before = shares;
    setShares((prev) => prev.filter((s) => s.user_id !== share.user_id));
    try {
      await unshareTask(taskId, share.user_id);
    } catch (err) {
      setShares(before);
      setActionError(errorMessage(err, 'Could not revoke access.'));
    }
  }

  return (
    <section className="td-card td-share">
      <h3 className="td-card-title">Sharing</h3>

      <div className="td-share-add">
        <input
          ref={inputRef}
          type="search"
          className="td-share-input"
          placeholder="Find a teammate by name or email…"
          value={query}
          onChange={handleQueryChange}
          aria-label="Search users to share with"
        />
        <select
          className="td-share-perm"
          value={permission}
          onChange={(e) => setPermission(e.target.value)}
          aria-label="Permission to grant"
        >
          <option value="view">Can view</option>
          <option value="edit">Can edit</option>
        </select>
      </div>

      {debounced && (
        <ul className="td-share-results" role="listbox" aria-label="User search results">
          {searching && <li className="td-share-empty">Searching…</li>}
          {!searching && results.length === 0 && (
            <li className="td-share-empty">No matches.</li>
          )}
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="td-share-result"
                onClick={() => handleAdd(u)}
                disabled={adding}
              >
                <span className="td-share-result-name">{u.name || u.email}</span>
                {u.name && <span className="td-share-result-email">{u.email}</span>}
                <span className="td-share-result-add">{adding ? 'Adding…' : 'Add'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {actionError && <p className="dash-error td-share-error">{actionError}</p>}

      <div className="td-share-list-wrap">
        <p className="td-share-subhead">
          Shared with{' '}
          <span className="td-count">{loading ? '…' : shares.length}</span>
        </p>
        {loadError && <p className="dash-error">{loadError}</p>}
        {!loading && !loadError && shares.length === 0 && (
          <p className="dash-empty">Just you, for now.</p>
        )}
        {shares.length > 0 && (
          <ul className="td-share-list">
            {shares.map((s) => (
              <li key={s.user_id} className="td-share-row">
                <span className="td-share-row-name">{s.name || s.email}</span>
                {s.name && <span className="td-share-row-email">{s.email}</span>}
                <span className={`td-share-pill is-${s.permission}`}>
                  {s.permission === 'edit' ? 'Editor' : 'Viewer'}
                </span>
                <button
                  type="button"
                  className="td-share-revoke"
                  onClick={() => handleRevoke(s)}
                  aria-label={`Remove ${s.name || s.email}`}
                  title="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ShareTaskPanel;
