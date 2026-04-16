import { useMemo, useState } from 'react';
import { loadTasks } from '../utils/taskStorage.js';

function DashboardPage() {
  const [tasks] = useState(loadTasks);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const open = total - completed;
    const highPriority = tasks.filter((task) => task.priority === 'high').length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, open, highPriority, completionRate };
  }, [tasks]);

  const creatorList = useMemo(() => {
    const map = new Map();

    tasks.forEach((task) => {
      const displayName = task.creator?.name || 'Unknown';
      const creatorKey =
        task.creator?.id ?? task.creator?.email ?? displayName;
      const existing = map.get(creatorKey);

      if (existing) {
        existing.count += 1;
        return;
      }

      map.set(creatorKey, { key: creatorKey, name: displayName, count: 1 });
    });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tasks]);

  return (
    <section className="dashboard-page fade-up">
      <header className="page-head">
        <div>
          <p className="eyebrow">Performance Center</p>
          <h1>Dashboard</h1>
          <p className="lead">Overview of your board activity.</p>
        </div>
      </header>

      <section className="dashboard-summary-grid">
        <article className="card-surface summary-card">
          <p className="summary-label">Total Tasks</p>
          <h2 className="summary-value">{stats.total}</h2>
          <p className="summary-note">All tasks on this board.</p>
        </article>

        <article className="card-surface summary-card">
          <p className="summary-label">Completed</p>
          <h2 className="summary-value">{stats.completed}</h2>
          <p className="summary-note">Tasks marked done.</p>
        </article>

        <article className="card-surface summary-card">
          <p className="summary-label">Open</p>
          <h2 className="summary-value">{stats.open}</h2>
          <p className="summary-note">Tasks still active.</p>
        </article>

        <article className="card-surface summary-card">
          <p className="summary-label">High Priority</p>
          <h2 className="summary-value">{stats.highPriority}</h2>
          <p className="summary-note">Needs attention first.</p>
        </article>
      </section>

      <section className="dashboard-panels">
        <article className="card-surface dashboard-panel">
          <h3>Completion</h3>
          <p className="lead">{stats.completionRate}% complete</p>
          <div className="dashboard-progress-track" role="img" aria-label={`Completion ${stats.completionRate} percent`}>
            <div className="dashboard-progress-fill" style={{ width: `${stats.completionRate}%` }} />
          </div>
        </article>

        <article className="card-surface dashboard-panel">
          <h3>Tasks by Creator</h3>
          {creatorList.length ? (
            <ul className="mini-list">
              {creatorList.map((person) => (
                <li key={person.name} className="mini-row">
                  <span>{person.name}</span>
                  <strong>{person.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="lead">No data yet.</p>
          )}
        </article>
      </section>
    </section>
  );
}

export default DashboardPage;
