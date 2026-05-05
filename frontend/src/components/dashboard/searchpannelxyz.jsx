import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchTasks } from '../../api/taskApi';
import apiClient, { errorMessage } from '../../api/client';
import { fmtShort } from '../../utils/dateFormat';
import { useDebounce } from '../../hooks/useDebounce';

// Self-contained dashboard search: text input + debounced parallel
// fetch of matching tasks and people.
function SearchPanel({ currentUserEmail }) {
  const [input, setInput] = useState('');
  const term = useDebounce(input.trim(), 300);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [taskMatches, setTaskMatches] = useState([]);
  const [userMatches, setUserMatches] = useState([]);

  useEffect(() => {
    if (!term) {
      setTaskMatches([]);
      setUserMatches([]);
      setError(null);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setError(null);

    (async () => {
      try {
        const [taskRes, userRes] = await Promise.all([
          searchTasks({ q: term, limit: 8 }),
          apiClient.get('/users', { params: { search: term, limit: 8 } }),
        ]);
        if (cancelled) return;
        const users = (userRes.data || []).filter((u) => !currentUserEmail || u.email !== currentUserEmail);
        setTaskMatches(taskRes.data || []);
        setUserMatches(users);
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err, 'Search is unavailable right now.'));
          setTaskMatches([]);
          setUserMatches([]);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [term, currentUserEmail]);

  return (
    <section className="dash-card">
      <header className="dash-card-head dash-card-head-row">
        <div>
          <p className="dash-card-eyebrow">Search</p>
          <h3 className="dash-card-title">Find tasks and people</h3>
        </div>
      </header>

      <div className="tasks-search">
        <svg
          className="tasks-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          className="tasks-search-input"
          type="search"
          placeholder="Search tasks or people..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {searching && <p className="dash-empty">Searching...</p>}
      {error && <p className="dash-empty dash-error">{error}</p>}

      {!!term && !searching && !error && (
        <div className="dash-grid">
          <article className="dash-card">
            <header className="dash-card-head">
              <p className="dash-card-eyebrow">Tasks</p>
              <h3 className="dash-card-title">Matching tasks</h3>
            </header>
            {taskMatches.length === 0 ? (
              <p className="dash-empty">No task matches.</p>
            ) : (
              <ul className="dash-task-list">
                {taskMatches.map((t) => (
                  <li key={t.id} className="dash-task-row">
                    <Link to={`/tasks/${t.id}`} className="dash-task-link">
                      <span className={`dash-task-bar pri-${t.priority || 'low'}`} />
                      <span className="dash-task-title">{t.title}</span>
                      <span className="dash-task-due">
                        {t.due_date ? fmtShort(t.due_date) : 'No date'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="dash-card">
            <header className="dash-card-head">
              <p className="dash-card-eyebrow">People</p>
              <h3 className="dash-card-title">Matching users</h3>
            </header>
            {userMatches.length === 0 ? (
              <p className="dash-empty">No people matches.</p>
            ) : (
              <ul className="dash-cat-list">
                {userMatches.map((u) => (
                  <li key={u.id} className="dash-cat-row">
                    <span className="dash-cat-dot" style={{ background: '#6b7280' }} />
                    <span className="dash-cat-name">{u.name || 'Unnamed user'}</span>
                    <span className="dash-cat-count">{u.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      )}
    </section>
  );
}

export default SearchPanel;