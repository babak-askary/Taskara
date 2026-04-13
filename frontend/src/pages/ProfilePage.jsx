import { useTasks } from '../context/TaskContext.jsx';
import { useAppAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

const CATEGORY_ICONS = { Work: '💼', Personal: '🙂', Health: '💪', Shopping: '🛒', Education: '📚', Other: '📌' };

function StatBadge({ label, value, color }) {
  return (
    <div className="profile-stat" style={{ '--stat-color': color }}>
      <div className="profile-stat-value">{value}</div>
      <div className="profile-stat-label">{label}</div>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAppAuth();
  const { tasks } = useTasks();

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const totalTime = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const totalH = Math.floor(totalTime / 60);
  const totalM = totalTime % 60;

  const now = new Date();
  const overdue = tasks.filter(
    t => t.deadline && t.status !== 'completed' && new Date(t.deadline + 'T00:00:00') < now,
  ).length;

  // Category breakdown
  const catCounts = {};
  tasks.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
  const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

  // Top 3 most recent completed tasks
  const recentDone = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
      </div>

      <div className="profile-layout">
        {/* User card */}
        <div className="profile-card">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-lg">
              {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
          )}
          <h2 className="profile-name">{user?.name || 'User'}</h2>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-completion">
            <div className="completion-label">
              <span>Overall Completion</span>
              <span>{pct}%</span>
            </div>
            <div className="completion-bar">
              <div className="completion-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-grid">
          <StatBadge label="Total Tasks" value={total} color="#6366f1" />
          <StatBadge label="Completed" value={completed} color="#22c55e" />
          <StatBadge label="In Progress" value={inProgress} color="#3b82f6" />
          <StatBadge label="Overdue" value={overdue} color="#ef4444" />
          <StatBadge label="Time Logged" value={totalH ? `${totalH}h ${totalM}m` : `${totalM}m`} color="#f59e0b" />
          <StatBadge label="Completion Rate" value={`${pct}%`} color="#8b5cf6" />
        </div>
      </div>

      {/* Category breakdown */}
      <section className="profile-section">
        <h2 className="section-title">Tasks by Category</h2>
        {catEntries.length === 0 ? (
          <p className="empty-state-sm">No tasks yet</p>
        ) : (
          <div className="category-breakdown">
            {catEntries.map(([cat, count]) => (
              <div key={cat} className="cat-row">
                <span className="cat-icon">{CATEGORY_ICONS[cat] || '📌'}</span>
                <span className="cat-name">{cat}</span>
                <div className="cat-bar-track">
                  <div
                    className="cat-bar-fill"
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
                <span className="cat-count">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent completions */}
      {recentDone.length > 0 && (
        <section className="profile-section">
          <h2 className="section-title">Recently Completed</h2>
          <ul className="recent-done-list">
            {recentDone.map(t => (
              <li key={t.id}>
                <Link to={`/tasks/${t.id}`} className="recent-done-link">
                  ✅ {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
