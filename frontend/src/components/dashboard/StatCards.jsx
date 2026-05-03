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

function StatCards({ loading, dueToday, stats, perf }) {
  return (
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
  );
}

export default StatCards;
