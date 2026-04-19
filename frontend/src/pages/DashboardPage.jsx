import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getStats, getPerformance } from '../api/dashboardApi';
import { getTasks } from '../api/taskApi';
import { ask as askAI } from '../api/aiApi';

const SUGGESTIONS = [
  'What should I focus on today?',
  'Summarize my week',
  "What's overdue?",
  'Show my top categories',
];

function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(user) {
  if (!user) return '';
  const s = user.given_name || user.name || user.nickname || user.email || '';
  return s.split(/[\s@]/)[0];
}

function fmtDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  return new Date(dateStr) < new Date();
}

function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();

  const [stats, setStats] = useState(null);
  const [perf, setPerf] = useState(null);
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [s, p, t] = await Promise.all([getStats(), getPerformance(), getTasks()]);
        if (cancelled) return;
        setStats(s.data.stats);
        setCategories(s.data.category_breakdown || []);
        setPerf(p.data.metrics);
        setTrend(p.data.trend || []);
        setTasks(t.data || []);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.response?.data?.message || 'Could not load your dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const upNext = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      })
      .slice(0, 6);
  }, [tasks]);

  const dueToday = useMemo(
    () => tasks.filter((t) => t.status !== 'done' && isToday(t.due_date)).length,
    [tasks]
  );

  const trendBars = useMemo(() => {
    const max = Math.max(1, ...trend.map((d) => d.completed));
    return trend.map((d) => ({
      day: new Date(d.day),
      completed: d.completed,
      height: Math.max(4, (d.completed / max) * 100),
    }));
  }, [trend]);

  async function submitAI(prompt) {
    const p = (prompt ?? aiPrompt).trim();
    if (!p || aiPending) return;
    setAiError(null);
    setAiAnswer(null);
    setAiPending(true);
    try {
      const { data } = await askAI(p);
      setAiAnswer(data);
    } catch (err) {
      setAiError(err.response?.data?.message || 'Taskara AI is not available right now.');
    } finally {
      setAiPending(false);
    }
  }

  function handleChip(text) {
    setAiPrompt(text);
    submitAI(text);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAI();
    }
  }

  if (authLoading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="dash">
      <header className="dash-header">
        <p className="dash-date">{fmtDate()}</p>
        <h1 className="dash-greeting">
          {greetingFor()}
          {firstName(user) ? `, ${firstName(user)}` : ''}.
        </h1>
        <p className="dash-subtitle">Here's what's happening in your workspace.</p>
      </header>

      {/* AI Assistant */}
      <section className="ai-panel">
        <div className="ai-head">
          <div className="ai-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" stroke="none" />
              <path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9L19 15z" fill="currentColor" stroke="none" opacity="0.8" />
            </svg>
          </div>
          <div className="ai-head-text">
            <p className="ai-title">Ask Taskara</p>
            <p className="ai-sub">Quick answers about your tasks, your week, what to focus on.</p>
          </div>
        </div>

        <div className="ai-input-row">
          <input
            className="ai-input"
            type="text"
            placeholder="Ask anything — e.g. What should I do next?"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={aiPending}
          />
          <button
            className="ai-send"
            onClick={() => submitAI()}
            disabled={aiPending || !aiPrompt.trim()}
            aria-label="Send"
          >
            {aiPending ? <span className="ai-spinner" aria-hidden="true" /> : 'Ask'}
          </button>
        </div>

        <div className="ai-chips">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="ai-chip"
              onClick={() => handleChip(s)}
              disabled={aiPending}
            >
              {s}
            </button>
          ))}
        </div>

        {aiError && <p className="ai-error">{aiError}</p>}
        {aiAnswer && (
          <div className="ai-answer">
            <div className="ai-answer-text">{aiAnswer.reply}</div>
            <div className="ai-answer-meta">
              <span className="ai-answer-dot" />
              {aiAnswer.source === 'anthropic' ? 'Claude' : 'Taskara helper'}
            </div>
          </div>
        )}
      </section>

      {/* Stat cards */}
      <section className="dash-stats">
        <StatCard label="Due today" value={loading ? null : dueToday} accent="blue" />
        <StatCard
          label="Overdue"
          value={loading ? null : stats?.overdue ?? 0}
          accent={stats?.overdue > 0 ? 'red' : 'muted'}
        />
        <StatCard
          label="Done this week"
          value={loading ? null : perf?.completed_this_week ?? 0}
          accent="green"
          delta={
            !loading && perf
              ? (perf.completed_this_week ?? 0) - (perf.completed_last_week ?? 0)
              : null
          }
        />
        <StatCard
          label="On-time rate"
          value={loading ? null : `${perf?.on_time_rate ?? 0}%`}
          accent="purple"
        />
      </section>

      {/* Trend + Categories */}
      <section className="dash-grid">
        <article className="dash-card dash-card-wide">
          <header className="dash-card-head">
            <p className="dash-card-eyebrow">Completion trend</p>
            <h3 className="dash-card-title">Tasks completed, last 14 days</h3>
          </header>
          {loading ? (
            <div className="dash-skel dash-skel-chart" />
          ) : trendBars.length === 0 ? (
            <p className="dash-empty">No activity yet.</p>
          ) : (
            <div className="dash-trend">
              <div className="dash-trend-bars">
                {trendBars.map((b, i) => (
                  <div className="dash-trend-col" key={i}>
                    <div
                      className="dash-trend-bar"
                      style={{ height: `${b.height}%` }}
                      title={`${b.completed} completed`}
                    />
                  </div>
                ))}
              </div>
              <div className="dash-trend-axis">
                {trendBars.map((b, i) => (
                  <span key={i}>{i % 3 === 0 ? b.day.getDate() : ''}</span>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="dash-card">
          <header className="dash-card-head">
            <p className="dash-card-eyebrow">Breakdown</p>
            <h3 className="dash-card-title">Top categories</h3>
          </header>
          {loading ? (
            <div className="dash-skel dash-skel-list" />
          ) : categories.length === 0 ? (
            <p className="dash-empty">No categories yet. Assign a category to a task to see the breakdown.</p>
          ) : (
            <ul className="dash-cat-list">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id || c.name} className="dash-cat-row">
                  <span className="dash-cat-dot" style={{ background: c.color || '#9ca3af' }} />
                  <span className="dash-cat-name">{c.name}</span>
                  <span className="dash-cat-count">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* Up next */}
      <section className="dash-card">
        <header className="dash-card-head dash-card-head-row">
          <div>
            <p className="dash-card-eyebrow">Up next</p>
            <h3 className="dash-card-title">Your open tasks</h3>
          </div>
          <Link to="/tasks" className="dash-link">View all →</Link>
        </header>

        {loading ? (
          <div className="dash-skel dash-skel-list" />
        ) : loadError ? (
          <p className="dash-empty dash-error">{loadError}</p>
        ) : upNext.length === 0 ? (
          <p className="dash-empty">
            Nothing on your plate. <Link to="/tasks" className="dash-link">Create a task →</Link>
          </p>
        ) : (
          <ul className="dash-task-list">
            {upNext.map((t) => {
              const overdue = isOverdue(t.due_date, t.status);
              const today = isToday(t.due_date);
              return (
                <li key={t.id} className="dash-task-row">
                  <Link to={`/tasks/${t.id}`} className="dash-task-link">
                    <span className={`dash-task-bar pri-${t.priority || 'low'}`} />
                    <span className="dash-task-title">{t.title}</span>
                    {t.category_name && (
                      <span
                        className="dash-task-cat"
                        style={{ color: t.category_color || 'var(--text-dim)' }}
                      >
                        {t.category_name}
                      </span>
                    )}
                    <span
                      className={`dash-task-due ${overdue ? 'is-overdue' : today ? 'is-today' : ''}`}
                    >
                      {t.due_date
                        ? new Date(t.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No date'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, accent, delta }) {
  const isLoading = value === null || value === undefined;
  return (
    <div className={`dash-stat dash-stat-${accent}`}>
      <p className="dash-stat-label">{label}</p>
      <p className="dash-stat-value">
        {isLoading ? <span className="dash-skel dash-skel-num" /> : value}
      </p>
      {typeof delta === 'number' && (
        <p className={`dash-stat-delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`}>
          {delta > 0 ? `+${delta}` : delta} vs last week
        </p>
      )}
    </div>
  );
}

export default DashboardPage;
