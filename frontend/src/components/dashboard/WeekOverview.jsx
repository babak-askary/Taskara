import { useMemo } from 'react';
import { Link } from 'react-router-dom';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function nextRecurrence(rule, date) {
  const d = new Date(date);
  switch (rule) {
    case 'daily':   d.setDate(d.getDate() + 1); return d;
    case 'weekly':  d.setDate(d.getDate() + 7); return d;
    case 'monthly': d.setMonth(d.getMonth() + 1); return d;
    default: return null;
  }
}

function WeekOverview({ tasks, loading }) {
  const now = useMemo(() => new Date(), []);
  const days = useMemo(() => {
    const start = startOfWeek(now);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [now]);

  const tasksByDay = useMemo(() => {
    const buckets = days.map(() => []);
    if (!Array.isArray(tasks)) return buckets;
    const weekStartMs = days[0].getTime();
    const weekEnd = new Date(days[6]); weekEnd.setHours(23, 59, 59, 999);
    const weekEndMs = weekEnd.getTime();

    const place = (t, dueIso) => {
      const idx = days.findIndex((d) => sameDay(d, new Date(dueIso)));
      if (idx === -1) return;
      buckets[idx].push({ ...t, due_date: dueIso });
    };

    for (const t of tasks) {
      if (!t.due_date) continue;
      place(t, t.due_date);
      // Project recurring future occurrences into the week.
      if (t.is_recurring && t.recurrence_rule && t.status !== 'done') {
        let next = nextRecurrence(t.recurrence_rule, new Date(t.due_date));
        let safety = 0;
        while (next && next.getTime() <= weekEndMs && safety < 60) {
          if (next.getTime() >= weekStartMs) place(t, next.toISOString());
          next = nextRecurrence(t.recurrence_rule, next);
          safety++;
        }
      }
    }
    for (const list of buckets) {
      list.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    }
    return buckets;
  }, [tasks, days]);

  const totalThisWeek = tasksByDay.reduce((sum, list) => sum + list.length, 0);
  const todayIdx = days.findIndex((d) => sameDay(d, now));

  const weekRange = useMemo(() => {
    const opts = { month: 'short', day: 'numeric' };
    return `${days[0].toLocaleDateString(undefined, opts)} – ${days[6].toLocaleDateString(undefined, opts)}`;
  }, [days]);

  return (
    <section className="dash-card week-ov">
      <header className="dash-card-head dash-card-head-row">
        <div>
          <p className="dash-card-eyebrow">This week</p>
          <h3 className="dash-card-title">Overview</h3>
        </div>
        <div className="week-ov-meta">
          <span className="week-ov-range">{weekRange}</span>
          <Link to="/calendar" className="dash-link">Open calendar →</Link>
        </div>
      </header>

      {loading ? (
        <div className="dash-skel dash-skel-list" />
      ) : totalThisWeek === 0 ? (
        <p className="dash-empty">Nothing scheduled this week.</p>
      ) : (
        <div className="week-ov-grid">
          {days.map((d, i) => {
            const list = tasksByDay[i];
            const isToday = i === todayIdx;
            return (
              <div key={i} className={`week-ov-col ${isToday ? 'is-today' : ''}`}>
                <div className="week-ov-head">
                  <span className="week-ov-dow">{DAY_LABELS[d.getDay()]}</span>
                  <span className="week-ov-dnum">{d.getDate()}</span>
                </div>
                <div className="week-ov-list">
                  {list.length === 0 ? (
                    <span className="week-ov-empty">—</span>
                  ) : (
                    list.slice(0, 4).map((t) => {
                      const due = new Date(t.due_date);
                      const cls = [
                        'week-ov-pill',
                        `pri-${t.priority || 'low'}`,
                        t.status === 'done' ? 'is-done' : '',
                      ].filter(Boolean).join(' ');
                      return (
                        <Link
                          key={t.id}
                          to={`/tasks/${t.id}`}
                          className={cls}
                          title={`${t.title} — ${fmtTime(due)}`}
                        >
                          <span className="week-ov-time">{fmtTime(due)}</span>
                          <span className="week-ov-title">{t.title}</span>
                        </Link>
                      );
                    })
                  )}
                  {list.length > 4 && (
                    <Link to="/calendar" className="week-ov-more">+{list.length - 4} more</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default WeekOverview;
