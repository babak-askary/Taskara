import { useAuth0 } from '@auth0/auth0-react';
import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { fmtDate, fmtShort, isToday, isOverdue } from '../utils/dateFormat';
import { useDashboardData } from '../hooks/useDashboardData';
import StatCards from '../components/dashboard/StatCards';
import SearchPanel from '../components/dashboard/SearchPanel';
import AIAssistant from '../components/dashboard/AIAssistant';
import WeekOverview from '../components/dashboard/WeekOverview';

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

function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const { stats, categories, perf, trend, tasks, loading, error: loadError } = useDashboardData(isAuthenticated);

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

      <AIAssistant />
      <WeekOverview tasks={tasks} loading={loading} />
      <SearchPanel currentUserEmail={user?.email} />

      <StatCards loading={loading} dueToday={dueToday} stats={stats} perf={perf} />

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
                      <span className="dash-task-cat" style={{ color: t.category_color || 'var(--text-dim)' }}>
                        {t.category_name}
                      </span>
                    )}
                    <span className={`dash-task-due ${overdue ? 'is-overdue' : today ? 'is-today' : ''}`}>
                      {t.due_date ? fmtShort(t.due_date) : 'No date'}
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

export default DashboardPage;
