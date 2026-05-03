import { useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import WeekCalendar from '../components/dashboard/WeekCalendar';
import QuickCreateTask from '../components/dashboard/QuickCreateTask';
import QuickEditTask from '../components/dashboard/QuickEditTask';
import { getTasks } from '../api/taskApi';
import { errorMessage } from '../api/client';

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function CalendarPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [pickedSlot, setPickedSlot] = useState(null);
  const [pickedAnchor, setPickedAnchor] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editAnchor, setEditAnchor] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getTasks();
        if (!cancelled) setTasks(res.data || []);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load your calendar.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const weekRange = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const opts = { month: 'long', day: 'numeric' };
    const yearOpts = { year: 'numeric' };
    return {
      label: `${weekStart.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`,
      year: weekStart.toLocaleDateString(undefined, yearOpts),
    };
  }, [weekStart]);

  const weekStats = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    const inWeek = tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= weekStart && d < end;
    });
    const done = inWeek.filter((t) => t.status === 'done').length;
    return { count: inWeek.length, done };
  }, [tasks, weekStart]);

  const isCurrentWeek = useMemo(
    () => startOfWeek(new Date()).getTime() === weekStart.getTime(),
    [weekStart]
  );

  const shiftWeek = (delta) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  };

  const goToday = () => setWeekStart(startOfWeek(new Date()));

  // Pick a sensible default time for the "+ New task" button:
  // current time rounded up to the next 15-min increment, on the visible week.
  // No cursor anchor here — the centered modal is the right affordance for a
  // header button rather than for a click on the grid.
  const openCreateNow = () => {
    const base = isCurrentWeek ? new Date() : new Date(weekStart);
    if (!isCurrentWeek) base.setHours(9, 0, 0, 0);
    const m = base.getMinutes();
    if (isCurrentWeek) base.setMinutes(Math.ceil(m / 15) * 15, 0, 0);
    setPickedAnchor(null);
    setPickedSlot(base);
  };

  const handleSlotPick = (date, anchor) => {
    setPickedAnchor(anchor || null);
    setPickedSlot(date);
  };

  const closeQuickCreate = () => {
    setPickedSlot(null);
    setPickedAnchor(null);
    setDraft(null);
  };

  if (authLoading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="dash cal-page">
      <header className="cal-page-head">
        <div className="cal-page-headline">
          <p className="cal-page-eyebrow">
            <span className="cal-page-eyebrow-dot" />
            Calendar
            {isCurrentWeek && <span className="cal-page-eyebrow-pill">This week</span>}
          </p>
          <h1 className="cal-page-title">{weekRange.label}</h1>
          <p className="cal-page-year">{weekRange.year}</p>
        </div>

        <div className="cal-page-controls">
          <div className="cal-nav-group">
            <button className="cal-nav-btn" onClick={() => shiftWeek(-1)} aria-label="Previous week">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              className={`cal-today-btn ${isCurrentWeek ? 'is-current' : ''}`}
              onClick={goToday}
              disabled={isCurrentWeek}
            >
              Today
            </button>
            <button className="cal-nav-btn" onClick={() => shiftWeek(1)} aria-label="Next week">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
          <button className="cal-new-btn" onClick={openCreateNow}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New task</span>
          </button>
        </div>
      </header>

      <div className="cal-stats">
        <div className="cal-stat">
          <span className="cal-stat-value">{loading ? '—' : weekStats.count}</span>
          <span className="cal-stat-label">Scheduled</span>
        </div>
        <div className="cal-stat-divider" aria-hidden="true" />
        <div className="cal-stat">
          <span className="cal-stat-value">{loading ? '—' : weekStats.done}</span>
          <span className="cal-stat-label">Completed</span>
        </div>
      </div>

      {error && <p className="dash-empty dash-error">{error}</p>}
      <p className="cal-page-hint">
        Tip — double-click an empty slot to add a task. Right-click a task to edit it. Drag to move; drag the edges to resize.
      </p>
      <WeekCalendar
        tasks={tasks}
        loading={loading}
        weekStart={weekStart}
        onSlotPick={handleSlotPick}
        draft={pickedSlot ? draft : null}
        onTaskUpdate={(updated) => {
          const { spawned, ...rest } = updated || {};
          setTasks((prev) => {
            let out = prev.map((t) => (t.id === rest.id ? { ...t, ...rest } : t));
            if (spawned?.id && !out.some((t) => t.id === spawned.id)) {
              out = [spawned, ...out];
            }
            return out;
          });
        }}
        onTaskContextMenu={(task, anchor) => {
          setEditingTask(task);
          setEditAnchor(anchor);
        }}
      />

      {pickedSlot && (
        <QuickCreateTask
          initialDate={pickedSlot}
          anchor={pickedAnchor}
          onClose={closeQuickCreate}
          onCreated={(task) => {
            setTasks((prev) => [task, ...prev]);
            setDraft(null);
          }}
          onDraftChange={setDraft}
        />
      )}

      {editingTask && (
        <QuickEditTask
          task={editingTask}
          anchor={editAnchor}
          onClose={() => { setEditingTask(null); setEditAnchor(null); }}
          onSaved={(updated) => {
            const { spawned, ...rest } = updated || {};
            setTasks((prev) => {
              let out = prev.map((t) => (t.id === rest.id ? { ...t, ...rest } : t));
              if (spawned?.id && !out.some((t) => t.id === spawned.id)) {
                out = [spawned, ...out];
              }
              return out;
            });
          }}
        />
      )}
    </div>
  );
}

export default CalendarPage;
