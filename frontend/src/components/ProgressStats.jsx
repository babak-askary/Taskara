// SVG-based charts — no external chart library needed

const COLORS = {
  todo: '#94a3b8',
  'in-progress': '#3b82f6',
  completed: '#22c55e',
};

const CATEGORY_COLORS = {
  Work: '#6366f1',
  Personal: '#ec4899',
  Health: '#22c55e',
  Shopping: '#f59e0b',
  Education: '#3b82f6',
  Other: '#94a3b8',
};

// ─── Status donut ─────────────────────────────────────────────────────────────
function StatusDonut({ tasks }) {
  const counts = { todo: 0, 'in-progress': 0, completed: 0 };
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
  const total = tasks.length || 1;

  const radius = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const slices = Object.entries(counts).map(([status, count]) => {
    const frac = count / total;
    const dashLen = frac * circumference;
    const slice = { status, count, frac, dashLen, offset };
    offset += dashLen;
    return slice;
  });

  const completedPct = Math.round((counts.completed / total) * 100);

  return (
    <div className="chart-card">
      <h3 className="chart-title">Tasks by Status</h3>
      <div className="donut-wrap">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {slices.map(s => (
            <circle
              key={s.status}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={COLORS[s.status]}
              strokeWidth="20"
              strokeDasharray={`${s.dashLen} ${circumference - s.dashLen}`}
              strokeDashoffset={-s.offset + circumference / 4}
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1e293b">{completedPct}%</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#64748b">complete</text>
        </svg>
        <ul className="chart-legend">
          {slices.map(s => (
            <li key={s.status} className="legend-item">
              <span className="legend-dot" style={{ background: COLORS[s.status] }} />
              <span className="legend-label">
                {s.status === 'todo' ? 'To Do' : s.status === 'in-progress' ? 'In Progress' : 'Done'}
              </span>
              <span className="legend-count">{s.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Category bar chart ───────────────────────────────────────────────────────
function CategoryBar({ tasks }) {
  const counts = {};
  tasks.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maxVal = Math.max(...entries.map(e => e[1]), 1);

  return (
    <div className="chart-card">
      <h3 className="chart-title">Tasks by Category</h3>
      <div className="bar-chart">
        {entries.length === 0 ? (
          <p className="empty-state-sm">No tasks yet</p>
        ) : (
          entries.map(([cat, count]) => (
            <div key={cat} className="bar-row">
              <span className="bar-label">{cat}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(count / maxVal) * 100}%`,
                    background: CATEGORY_COLORS[cat] || '#94a3b8',
                  }}
                />
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ProgressStats({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;

  const now = new Date();
  const overdue = tasks.filter(
    t => t.deadline && t.status !== 'completed' && new Date(t.deadline + 'T00:00:00') < now,
  ).length;

  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="progress-stats">
      {/* Stat cards row */}
      <div className="stat-cards">
        <StatCard label="Total Tasks" value={total} icon="📋" color="#6366f1" />
        <StatCard label="Completed" value={completed} icon="✅" color="#22c55e" sub={`${pct}%`} />
        <StatCard label="In Progress" value={inProgress} icon="🔄" color="#3b82f6" />
        <StatCard label="Overdue" value={overdue} icon="⚠️" color="#ef4444" />
        <StatCard label="To Do" value={todo} icon="📌" color="#94a3b8" />
      </div>

      {/* Charts row */}
      <div className="chart-row">
        <StatusDonut tasks={tasks} />
        <CategoryBar tasks={tasks} />
      </div>
    </div>
  );
}
