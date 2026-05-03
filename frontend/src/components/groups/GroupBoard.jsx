import { useMemo, useState } from 'react';
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

function nextRecurrence(rule, date) {
  const d = new Date(date);
  switch (rule) {
    case 'daily':   d.setDate(d.getDate() + 1); return d;
    case 'weekly':  d.setDate(d.getDate() + 7); return d;
    case 'monthly': d.setMonth(d.getMonth() + 1); return d;
    default: return null;
  }
}

function initials(s) {
  return (s || '?').split(/[\s@]/)[0].slice(0, 2).toUpperCase();
}

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function GroupBoard({ tasks, members }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const now = new Date();

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const todayIdx = useMemo(() => days.findIndex((d) => sameDay(d, now)), [days, now]);

  const isCurrentWeek = startOfWeek(now).getTime() === weekStart.getTime();

  // Project recurring tasks across this week so members see future occurrences
  // even though they aren't yet spawned in the DB.
  const expanded = useMemo(() => {
    const out = [];
    if (!Array.isArray(tasks) || days.length === 0) return out;
    const weekStartMs = days[0].getTime();
    const weekEnd = new Date(days[6]); weekEnd.setHours(23, 59, 59, 999);
    const weekEndMs = weekEnd.getTime();

    for (const t of tasks) {
      out.push({ ...t, _key: String(t.id) });
      if (t.is_recurring && t.recurrence_rule && t.due_date && t.status !== 'done') {
        let next = nextRecurrence(t.recurrence_rule, new Date(t.due_date));
        let safety = 0;
        while (next && next.getTime() <= weekEndMs && safety < 60) {
          if (next.getTime() >= weekStartMs) {
            const iso = next.toISOString();
            out.push({ ...t, due_date: iso, _virtual: true, _key: `${t.id}-${iso}` });
          }
          next = nextRecurrence(t.recurrence_rule, next);
          safety++;
        }
      }
    }
    return out;
  }, [tasks, days]);

  // Bucket: member.id -> Array(7) of task lists
  const byMemberDay = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(m.id, days.map(() => [])));
    for (const t of expanded) {
      if (!t.due_date) continue;
      const due = new Date(t.due_date);
      const dayIdx = days.findIndex((d) => sameDay(d, due));
      if (dayIdx === -1) continue;
      const buckets = map.get(t.owner_id);
      if (!buckets) continue; // assignee not in the visible member list
      buckets[dayIdx].push(t);
    }
    // Sort each cell by time.
    for (const buckets of map.values()) {
      for (const list of buckets) {
        list.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      }
    }
    return map;
  }, [expanded, days, members]);

  // Unscheduled (no due_date) per member.
  const undatedByMember = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(m.id, []));
    for (const t of tasks) {
      if (t.due_date) continue;
      if (t.status === 'done') continue;
      const list = map.get(t.owner_id);
      if (list) list.push(t);
    }
    return map;
  }, [tasks, members]);

  const weekRange = useMemo(() => {
    const opts = { month: 'short', day: 'numeric' };
    return `${days[0].toLocaleDateString(undefined, opts)} – ${days[6].toLocaleDateString(undefined, opts)}`;
  }, [days]);

  const shiftWeek = (delta) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  };

  return (
    <article className="dash-card gp-board">
      <header className="dash-card-head dash-card-head-row">
        <div>
          <p className="dash-card-eyebrow">Schedule</p>
          <h3 className="dash-card-title">Who's doing what · {weekRange}</h3>
        </div>
        <div className="cal-nav-group">
          <button className="cal-nav-btn" onClick={() => shiftWeek(-1)} aria-label="Previous week">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            className={`cal-today-btn ${isCurrentWeek ? 'is-current' : ''}`}
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            disabled={isCurrentWeek}
          >
            Today
          </button>
          <button className="cal-nav-btn" onClick={() => shiftWeek(1)} aria-label="Next week">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </header>

      <div className="gp-board-scroll">
        <div className="gp-board-grid">
          {/* Day header row */}
          <div className="gp-board-corner" aria-hidden="true" />
          {days.map((d, i) => (
            <div
              key={i}
              className={`gp-board-day-head ${i === todayIdx ? 'is-today' : ''}`}
            >
              <span className="gp-board-dow">{DAY_LABELS[d.getDay()]}</span>
              <span className="gp-board-dnum">{d.getDate()}</span>
            </div>
          ))}

          {/* Member rows */}
          {members.map((m) => {
            const cells = byMemberDay.get(m.id) || [];
            const undated = undatedByMember.get(m.id) || [];
            return (
              <div className="gp-board-member-row" key={m.id} style={{ display: 'contents' }}>
                <div className="gp-board-member">
                  <span className="gp-avatar" aria-hidden="true">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt="" />
                      : <span>{initials(m.name || m.email)}</span>}
                  </span>
                  <div className="gp-board-member-meta">
                    <span className="gp-board-member-name">{m.name || m.email}</span>
                    <span className={`gp-role gp-role-${m.role}`}>{m.role}</span>
                  </div>
                  {undated.length > 0 && (
                    <span className="gp-board-undated-count" title={`${undated.length} task${undated.length === 1 ? '' : 's'} with no date`}>
                      +{undated.length}
                    </span>
                  )}
                </div>

                {cells.map((list, i) => {
                  const isToday = i === todayIdx;
                  return (
                    <div
                      key={i}
                      className={`gp-board-cell ${isToday ? 'is-today' : ''} ${list.length === 0 ? 'is-empty' : ''}`}
                    >
                      {list.map((t) => {
                        const due = new Date(t.due_date);
                        const overdue = t.status !== 'done' && due < now;
                        const cls = [
                          'gp-board-task',
                          `status-${t.status}`,
                          `pri-${t.priority || 'low'}`,
                          overdue ? 'is-overdue' : '',
                          t._virtual ? 'is-virtual' : '',
                        ].filter(Boolean).join(' ');
                        return (
                          <Link
                            key={t._key}
                            to={`/tasks/${t.id}`}
                            className={cls}
                            title={`${t.title} — ${fmtTime(due)} · ${t.status.replace('_', ' ')}`}
                          >
                            <span className="gp-board-task-time">{fmtTime(due)}</span>
                            <span className="gp-board-task-title">{t.title}</span>
                            {t.is_recurring && <span className="gp-board-task-recur" aria-hidden="true">↻</span>}
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="gp-board-legend" aria-hidden="true">
        <span className="gp-board-legend-item"><span className="gp-board-legend-dot status-todo" />To do</span>
        <span className="gp-board-legend-item"><span className="gp-board-legend-dot status-in_progress" />In progress</span>
        <span className="gp-board-legend-item"><span className="gp-board-legend-dot status-done" />Done</span>
        <span className="gp-board-legend-item"><span className="gp-board-legend-dot is-overdue" />Overdue</span>
      </div>
    </article>
  );
}

export default GroupBoard;
