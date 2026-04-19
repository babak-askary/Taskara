import { useEffect, useMemo, useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Build a 42-cell (6-week) grid starting on Sunday.
function buildGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay(); // 0 = Sunday

  const cells = [];
  for (let i = leading - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), outside: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(year, month, i), outside: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      outside: true,
    });
  }
  return cells;
}

function DueDatePicker({ isOpen, taskTitle, onConfirm, onSkip, onClose }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewDate, setViewDate] = useState(today);
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState('17:00');

  // Reset state each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setViewDate(today);
      setSelected(null);
      setTime('17:00');
    }
  }, [isOpen, today]);

  // Lock background scroll + Esc to cancel
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cells = buildGrid(viewDate);
  const monthLabel = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  function prevMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }

  function pickDate(d) {
    setSelected(d);
    if (d.getMonth() !== viewDate.getMonth()) {
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  function handleShortcut(offsetDays) {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    setSelected(d);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  function handleConfirm() {
    if (!selected) return;
    const [h, m] = (time || '17:00').split(':').map((n) => parseInt(n, 10) || 0);
    const final = new Date(selected);
    final.setHours(h, m, 0, 0);
    onConfirm(final.toISOString());
  }

  const confirmLabel = selected
    ? `Set for ${selected.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : 'Pick a date';

  return (
    <div className="ddp-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="ddp-modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="ddp-header">
          <p className="ddp-eyebrow">Due date</p>
          <h3 className="ddp-title">{taskTitle || 'New task'}</h3>
          <p className="ddp-sub">Pick a day, or skip if there's no deadline.</p>
        </header>

        <div className="ddp-shortcuts">
          <button type="button" className="ddp-shortcut" onClick={() => handleShortcut(0)}>
            Today
          </button>
          <button type="button" className="ddp-shortcut" onClick={() => handleShortcut(1)}>
            Tomorrow
          </button>
          <button type="button" className="ddp-shortcut" onClick={() => handleShortcut(7)}>
            Next week
          </button>
        </div>

        <div className="ddp-cal">
          <div className="ddp-nav">
            <button
              type="button"
              className="ddp-nav-btn"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="ddp-nav-title">{monthLabel}</span>
            <button
              type="button"
              className="ddp-nav-btn"
              onClick={nextMonth}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="ddp-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="ddp-days">
            {cells.map((c, i) => {
              const isToday = sameDay(c.date, today);
              const isSelected = sameDay(c.date, selected);
              const isPast = c.date < today && !isToday;
              return (
                <button
                  type="button"
                  key={i}
                  className={[
                    'ddp-day',
                    c.outside ? 'is-outside' : '',
                    isToday ? 'is-today' : '',
                    isSelected ? 'is-selected' : '',
                    isPast ? 'is-past' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => pickDate(c.date)}
                >
                  {c.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ddp-time">
          <label htmlFor="ddp-time-input" className="ddp-time-label">Time</label>
          <input
            id="ddp-time-input"
            type="time"
            className="ddp-time-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="ddp-actions">
          <button type="button" className="ddp-skip" onClick={onSkip}>
            Skip
          </button>
          <button
            type="button"
            className="ddp-confirm"
            onClick={handleConfirm}
            disabled={!selected}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DueDatePicker;
