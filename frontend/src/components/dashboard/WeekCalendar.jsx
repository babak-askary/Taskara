import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateTask } from '../../api/taskApi';

const HOUR_HEIGHT = 44;
const DAY_HEIGHT = HOUR_HEIGHT * 24;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MOBILE_BP = '(max-width: 720px)';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(MOBILE_BP).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BP);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

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

function minutesFromMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function fmtHour(h) {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

// Snap minutes-from-midnight to the nearest 15-min increment.
function snapTo15(minutes) {
  return Math.max(0, Math.min(1440 - 15, Math.round(minutes / 15) * 15));
}

// Compute the next occurrence of a recurring rule from `date`. Returns a new
// Date or null for unknown rules.
function nextRecurrence(rule, date) {
  const d = new Date(date);
  switch (rule) {
    case 'daily':   d.setDate(d.getDate() + 1); return d;
    case 'weekly':  d.setDate(d.getDate() + 7); return d;
    case 'monthly': d.setMonth(d.getMonth() + 1); return d;
    default: return null;
  }
}

function WeekCalendar({ tasks, loading, weekStart, onSlotPick, draft, onTaskUpdate, onTaskContextMenu }) {
  const [now, setNow] = useState(() => new Date());
  const scrollRef = useRef(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Drag state — { taskId, mode, startX, startY, pointerMoved, originalDueIso,
  // originalDuration, currentDueIso, currentDuration, dayIdx }. mode is one
  // of: 'move' | 'resize-top' | 'resize-bottom'.
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  useEffect(() => { dragRef.current = drag; }, [drag]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Scroll the grid to ~7 AM on first paint so the user sees their workday.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, [isMobile]);

  const days = useMemo(() => {
    const start = weekStart ? startOfWeek(weekStart) : startOfWeek(now);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [now, weekStart]);
  const daysRef = useRef(days);
  useEffect(() => { daysRef.current = days; }, [days]);

  // Begin a drag — called from pointerdown on the task body or its handles.
  const startDrag = (e, task, mode) => {
    if (e.button !== 0) return; // left-click only
    e.preventDefault();
    e.stopPropagation();
    const duration = task.estimated_time || 60;
    setDrag({
      taskId: task.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      pointerMoved: false,
      originalDueIso: task.due_date,
      originalDuration: duration,
      currentDueIso: task.due_date,
      currentDuration: duration,
    });
  };

  // While drag is active, listen on window so the pointer can leave the task
  // bounds without losing the gesture.
  useEffect(() => {
    if (!drag) return;
    document.body.classList.add('week-cal-dragging');

    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      // Need a small threshold so an accidental jiggle on click doesn't trigger a move.
      if (!d.pointerMoved && Math.hypot(dx, dy) < 4) return;

      const minutesPerPixel = 1440 / DAY_HEIGHT;
      const deltaMinutes = Math.round((dy * minutesPerPixel) / 15) * 15;
      const orig = new Date(d.originalDueIso);

      if (d.mode === 'move') {
        let newDue = new Date(orig);
        newDue.setMinutes(newDue.getMinutes() + deltaMinutes);
        // Cross-day: snap onto whichever column the cursor is currently over.
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const col = el && el.closest && el.closest('.week-cal-col');
        if (col) {
          const idx = Number(col.getAttribute('data-day-idx'));
          const targetDay = daysRef.current[idx];
          if (targetDay) {
            const adjusted = new Date(targetDay);
            adjusted.setHours(newDue.getHours(), newDue.getMinutes(), 0, 0);
            newDue = adjusted;
          }
        }
        // Clamp inside [00:00, 24:00 - duration]
        const dayStart = new Date(newDue); dayStart.setHours(0, 0, 0, 0);
        const minutesIntoDay = (newDue - dayStart) / 60000;
        const maxStart = 1440 - d.originalDuration;
        const clamped = Math.max(0, Math.min(maxStart, minutesIntoDay));
        const finalDue = new Date(dayStart);
        finalDue.setMinutes(clamped);
        setDrag((prev) => ({
          ...prev,
          pointerMoved: true,
          currentDueIso: finalDue.toISOString(),
          currentDuration: prev.originalDuration,
        }));
      } else if (d.mode === 'resize-top') {
        // Top edge moves — start shifts, end stays put.
        const endMs = orig.getTime() + d.originalDuration * 60000;
        let newStart = new Date(orig.getTime() + deltaMinutes * 60000);
        let newDuration = (endMs - newStart.getTime()) / 60000;
        if (newDuration < 15) {
          newDuration = 15;
          newStart = new Date(endMs - 15 * 60000);
        }
        // Don't let the start go negative on the day.
        const dayStart = new Date(newStart); dayStart.setHours(0, 0, 0, 0);
        const minutesIntoDay = (newStart - dayStart) / 60000;
        if (minutesIntoDay < 0) {
          newStart = new Date(dayStart);
          newDuration = (endMs - newStart.getTime()) / 60000;
        }
        setDrag((prev) => ({
          ...prev,
          pointerMoved: true,
          currentDueIso: newStart.toISOString(),
          currentDuration: newDuration,
        }));
      } else if (d.mode === 'resize-bottom') {
        // Bottom edge moves — start stays, duration grows/shrinks.
        let newDuration = d.originalDuration + deltaMinutes;
        if (newDuration < 15) newDuration = 15;
        // Don't let it overflow the day.
        const dayStart = new Date(orig); dayStart.setHours(0, 0, 0, 0);
        const startMin = (orig - dayStart) / 60000;
        if (startMin + newDuration > 1440) newDuration = 1440 - startMin;
        setDrag((prev) => ({
          ...prev,
          pointerMoved: true,
          currentDueIso: d.originalDueIso,
          currentDuration: newDuration,
        }));
      }
    };

    const onUp = async () => {
      const d = dragRef.current;
      if (!d) return;
      // No real movement → treat as a click and open the task detail.
      if (!d.pointerMoved) {
        setDrag(null);
        navigate(`/tasks/${d.taskId}`);
        return;
      }
      const changed =
        d.currentDueIso !== d.originalDueIso ||
        d.currentDuration !== d.originalDuration;
      setDrag(null);
      if (!changed) return;
      try {
        const res = await updateTask(d.taskId, {
          due_date: d.currentDueIso,
          estimated_time: Math.round(d.currentDuration),
        });
        if (onTaskUpdate) onTaskUpdate(res.data);
      } catch (err) {
        console.error('[week-cal] update on drag failed:', err);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      document.body.classList.remove('week-cal-dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, navigate, onTaskUpdate]);

  // Mobile shows one day at a time. Default to today if it's in the visible
  // week, otherwise the first day.
  const todayIdxInWeek = days.findIndex((d) => sameDay(d, now));
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => Math.max(0, todayIdxInWeek));
  // When the visible week changes (next/prev), reset to today if it's in
  // range, otherwise day 0 of the new week.
  useEffect(() => {
    setSelectedDayIdx(todayIdxInWeek >= 0 ? todayIdxInWeek : 0);
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Project recurring tasks forward into virtual occurrences for the visible
  // week. The seed task's own due_date is its first instance; we add more
  // copies (one per recurrence step) until we leave the week. Virtual copies
  // share the seed's id but carry _virtual=true so the drag/edit handlers
  // can treat them as read-only previews.
  const expandedTasks = useMemo(() => {
    const out = [];
    if (!Array.isArray(tasks) || days.length === 0) return out;
    const weekStartMs = days[0].getTime();
    const weekEnd = new Date(days[6]); weekEnd.setHours(23, 59, 59, 999);
    const weekEndMs = weekEnd.getTime();

    for (const t of tasks) {
      out.push({ ...t, _key: String(t.id) });
      if (
        t.is_recurring &&
        t.recurrence_rule &&
        t.due_date &&
        t.status !== 'done'
      ) {
        let next = nextRecurrence(t.recurrence_rule, new Date(t.due_date));
        let safety = 0;
        while (next && next.getTime() <= weekEndMs && safety < 60) {
          if (next.getTime() >= weekStartMs) {
            const iso = next.toISOString();
            out.push({
              ...t,
              due_date: iso,
              _virtual: true,
              _key: `${t.id}-${iso}`,
            });
          }
          next = nextRecurrence(t.recurrence_rule, next);
          safety++;
        }
      }
    }
    return out;
  }, [tasks, days]);

  // Group dated tasks by which day-column they belong to. While a task is
  // being dragged we use the drag's currentDueIso so the block follows the
  // cursor across day columns in real time.
  const tasksByDay = useMemo(() => {
    const buckets = days.map(() => []);
    for (const t of expandedTasks) {
      if (!t.due_date) continue;
      // Drag state only applies to the real seed task, not virtual copies.
      const dueIso = !t._virtual && drag && drag.taskId === t.id
        ? drag.currentDueIso
        : t.due_date;
      const due = new Date(dueIso);
      const idx = days.findIndex((d) => sameDay(d, due));
      if (idx === -1) continue;
      buckets[idx].push(t);
    }
    return buckets;
  }, [expandedTasks, days, drag]);

  // Counts per day, used by the mobile day strip dot indicator.
  const taskCountByDay = useMemo(() => tasksByDay.map((b) => b.length), [tasksByDay]);

  const undated = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter((t) => !t.due_date && t.status !== 'done').slice(0, 6);
  }, [tasks]);

  const weekRange = useMemo(() => {
    const first = days[0];
    const last = days[6];
    const opts = { month: 'short', day: 'numeric' };
    return `${first.toLocaleDateString(undefined, opts)} – ${last.toLocaleDateString(undefined, opts)}`;
  }, [days]);

  const todayIdx = days.findIndex((d) => sameDay(d, now));
  const nowMinutes = minutesFromMidnight(now);

  // Decide which day(s) to render. On mobile we render exactly one column.
  const visibleIdxs = isMobile ? [selectedDayIdx] : [0, 1, 2, 3, 4, 5, 6];

  // Find which day the draft falls on (or -1 if not in this week).
  const draftDayIdx = useMemo(() => {
    if (!draft || !draft.due_date) return -1;
    const dueDate = new Date(draft.due_date);
    return days.findIndex((d) => sameDay(d, dueDate));
  }, [draft, days]);

  // If the draft lands on a day that isn't currently visible (e.g. the user
  // edited the date in the form on mobile), pull that day into view so the
  // preview is never invisible.
  useEffect(() => {
    if (!isMobile || draftDayIdx < 0) return;
    if (draftDayIdx !== selectedDayIdx) setSelectedDayIdx(draftDayIdx);
  }, [draftDayIdx, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={`dash-card week-cal ${isMobile ? 'is-mobile' : ''}`}>
      <header className="dash-card-head dash-card-head-row">
        <div>
          <p className="dash-card-eyebrow">This week</p>
          <h3 className="dash-card-title">Your schedule</h3>
        </div>
        <span className="week-cal-range">{weekRange}</span>
      </header>

      {loading ? (
        <div className="dash-skel dash-skel-list" />
      ) : (
        <>
          {isMobile ? (
            <div className="week-cal-strip" role="tablist" aria-label="Pick a day">
              {days.map((d, i) => {
                const isToday = i === todayIdx;
                const isSelected = i === selectedDayIdx;
                const count = taskCountByDay[i] || 0;
                return (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={isSelected}
                    className={`week-cal-strip-day ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
                    onClick={() => setSelectedDayIdx(i)}
                  >
                    <span className="week-cal-strip-dow">{DAY_LABELS[d.getDay()]}</span>
                    <span className="week-cal-strip-dnum">{d.getDate()}</span>
                    {count > 0 && <span className="week-cal-strip-dot" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="week-cal-day-header">
              <div className="week-cal-gutter" aria-hidden="true" />
              {days.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={`week-cal-day-label ${i === todayIdx ? 'is-today' : ''} ${isWeekend ? 'is-weekend' : ''}`}
                  >
                    <span className="week-cal-dow">{DAY_LABELS[d.getDay()]}</span>
                    <span className="week-cal-dnum-wrap">
                      <span className="week-cal-dnum">{d.getDate()}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="week-cal-scroll" ref={scrollRef}>
            <div
              className="week-cal-grid"
              style={{
                height: `${DAY_HEIGHT}px`,
                gridTemplateColumns: isMobile ? '52px 1fr' : `64px repeat(7, 1fr)`,
              }}
            >
              <div className="week-cal-hours">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="week-cal-hour" style={{ height: `${HOUR_HEIGHT}px` }}>
                    <span>{h === 0 ? '' : fmtHour(h)}</span>
                  </div>
                ))}
              </div>

              {visibleIdxs.map((i) => {
                const d = days[i];
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                const pickFromEvent = (e) => {
                  if (!onSlotPick) return;
                  // Ignore clicks that landed on an existing task block
                  if (e.target.closest('.week-cal-task')) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top + e.currentTarget.scrollTop;
                  const minutes = snapTo15((y / DAY_HEIGHT) * 1440);
                  const picked = new Date(d);
                  picked.setHours(0, 0, 0, 0);
                  picked.setMinutes(minutes);
                  onSlotPick(picked, { x: e.clientX, y: e.clientY });
                };

                return (
                  <div
                    key={i}
                    data-day-idx={i}
                    className={`week-cal-col ${i === todayIdx ? 'is-today' : ''} ${isWeekend ? 'is-weekend' : ''} ${onSlotPick ? 'is-pickable' : ''}`}
                    onDoubleClick={pickFromEvent}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <div
                        key={h}
                        className="week-cal-slot"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                      />
                    ))}

                    {i === todayIdx && (
                      <div
                        className="week-cal-now"
                        style={{ top: `${(nowMinutes / 1440) * DAY_HEIGHT}px` }}
                        aria-label="Current time"
                      >
                        <span className="week-cal-now-dot" />
                      </div>
                    )}

                    {tasksByDay[i].map((t) => {
                      const isVirtual = !!t._virtual;
                      const isDragging = !isVirtual && drag && drag.taskId === t.id;
                      const dueIso = isDragging ? drag.currentDueIso : t.due_date;
                      const durationRaw = isDragging
                        ? drag.currentDuration
                        : t.estimated_time || 60;
                      const due = new Date(dueIso);
                      const start = minutesFromMidnight(due);
                      const duration = Math.max(15, durationRaw);
                      const top = (start / 1440) * DAY_HEIGHT;
                      const height = Math.min(
                        DAY_HEIGHT - top,
                        (duration / 60) * HOUR_HEIGHT
                      );
                      const cls = [
                        'week-cal-task',
                        `pri-${t.priority || 'low'}`,
                        t.status === 'done' ? 'is-done' : '',
                        height < 32 ? 'is-tiny' : '',
                        isDragging ? 'is-dragging' : '',
                        isVirtual ? 'is-virtual' : '',
                      ].filter(Boolean).join(' ');
                      const stripeColor = t.category_color || null;
                      // Right-click on a virtual occurrence opens the edit
                      // popover for the seed task (so changing the rule there
                      // re-shapes all its projected instances).
                      const handleContextMenu = (e) => {
                        if (!onTaskContextMenu) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const seed = isVirtual ? tasks.find((x) => x.id === t.id) || t : t;
                        onTaskContextMenu(seed, { x: e.clientX, y: e.clientY });
                      };
                      return (
                        <div
                          key={t._key || t.id}
                          role="button"
                          tabIndex={0}
                          className={cls}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            ...(stripeColor && { '--cat-stripe': stripeColor }),
                          }}
                          title={`${t.title} — ${due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${isVirtual ? ' (recurring preview)' : ''}`}
                          onPointerDown={
                            isVirtual
                              ? (e) => {
                                  // Plain click on a virtual block navigates to
                                  // the seed; no drag.
                                  if (e.button !== 0) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigate(`/tasks/${t.id}`);
                                }
                              : (e) => startDrag(e, t, 'move')
                          }
                          onContextMenu={handleContextMenu}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/tasks/${t.id}`);
                            }
                          }}
                        >
                          {!isVirtual && (
                            <span
                              className="week-cal-task-handle week-cal-task-handle-top"
                              onPointerDown={(e) => startDrag(e, t, 'resize-top')}
                              aria-hidden="true"
                            />
                          )}
                          {stripeColor && <span className="week-cal-task-stripe" aria-hidden="true" />}
                          <span className="week-cal-task-body">
                            <span className="week-cal-task-time">
                              {due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              {(t.is_recurring || isVirtual) && (
                                <span className="week-cal-task-recur" aria-hidden="true">↻</span>
                              )}
                            </span>
                            <span className="week-cal-task-title">{t.title}</span>
                            {t.group_slug && height >= 40 && (
                              <span className="week-cal-task-group">⊞ {t.group_slug}</span>
                            )}
                            {t.category_name && height >= 56 && (
                              <span className="week-cal-task-cat">{t.category_name}</span>
                            )}
                          </span>
                          {!isVirtual && (
                            <span
                              className="week-cal-task-handle week-cal-task-handle-bottom"
                              onPointerDown={(e) => startDrag(e, t, 'resize-bottom')}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      );
                    })}

                    {i === draftDayIdx && draft && (() => {
                      const due = new Date(draft.due_date);
                      const start = minutesFromMidnight(due);
                      const duration = Math.max(15, draft.estimated_time || 60);
                      const top = (start / 1440) * DAY_HEIGHT;
                      const height = Math.min(
                        DAY_HEIGHT - top,
                        (duration / 60) * HOUR_HEIGHT
                      );
                      const cls = [
                        'week-cal-task',
                        'is-draft',
                        `pri-${draft.priority || 'medium'}`,
                        height < 32 ? 'is-tiny' : '',
                      ].filter(Boolean).join(' ');
                      return (
                        <div
                          className={cls}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          aria-hidden="true"
                        >
                          <span className="week-cal-task-body">
                            <span className="week-cal-task-time">
                              {due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </span>
                            <span className="week-cal-task-title">{draft.title || 'New task'}</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>

          {undated.length > 0 && (
            <div className="week-cal-undated">
              <p className="week-cal-undated-label">No date set</p>
              <ul className="week-cal-undated-list">
                {undated.map((t) => (
                  <li key={t.id}>
                    <Link to={`/tasks/${t.id}`} className={`week-cal-undated-item pri-${t.priority || 'low'}`}>
                      <span className="week-cal-undated-bar" />
                      <span>{t.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default WeekCalendar;
