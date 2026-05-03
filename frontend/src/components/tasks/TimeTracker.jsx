import { useEffect, useState } from 'react';
import { errorMessage } from '../../api/client';
import {
  getTimeEntries,
  startTimer,
  stopTimer,
  addManualTime,
} from '../../api/timeApi';

function formatMinutes(min) {
  if (!min || min < 1) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function TimeTracker({ task, canEdit, onTaskChange }) {
  const [active, setActive] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('30');

  // Load active timer status
  useEffect(() => {
    if (!task?.id) return;
    let cancelled = false;
    getTimeEntries(task.id)
      .then((res) => { if (!cancelled) setActive(res.data?.active || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [task?.id]);

  // Live elapsed counter while timer is active
  useEffect(() => {
    if (!active) return;
    const startedMs = new Date(active.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startedMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  async function handleStart() {
    if (!task?.id || busy) return;
    setError(null);
    setBusy(true);
    try {
      const { data } = await startTimer(task.id);
      setActive(data);
      setElapsed(0);
    } catch (err) {
      setError(errorMessage(err, 'Could not start timer.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (!task?.id || busy) return;
    setError(null);
    setBusy(true);
    try {
      const { data } = await stopTimer(task.id);
      setActive(null);
      setElapsed(0);
      if (data?.task) onTaskChange?.(data.task);
    } catch (err) {
      setError(errorMessage(err, 'Could not stop timer.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const minutes = parseInt(manualMinutes, 10);
    if (!Number.isFinite(minutes) || minutes < 1) {
      setError('Enter a positive number of minutes.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { data } = await addManualTime(task.id, { minutes });
      if (data?.task) onTaskChange?.(data.task);
      setManualOpen(false);
      setManualMinutes('30');
    } catch (err) {
      setError(errorMessage(err, 'Could not log time.'));
    } finally {
      setBusy(false);
    }
  }

  const totalMinutes = task?.time_spent || 0;
  const estimate = task?.estimated_time;

  return (
    <section className="td-card td-time">
      <h3 className="td-card-title">Time</h3>

      <div className="td-time-totals">
        <div className="td-time-stat">
          <span className="td-time-stat-num">{formatMinutes(totalMinutes)}</span>
          <span className="td-time-stat-label">spent</span>
        </div>
        {estimate ? (
          <div className="td-time-stat">
            <span className="td-time-stat-num">{formatMinutes(estimate)}</span>
            <span className="td-time-stat-label">estimated</span>
          </div>
        ) : null}
      </div>

      {canEdit && (
        <>
          <div className="td-time-row">
            {active ? (
              <>
                <span className="td-time-elapsed" aria-live="polite">
                  <span className="td-time-pulse" aria-hidden="true" />
                  {formatElapsed(elapsed)}
                </span>
                <button
                  type="button"
                  className="td-time-btn td-time-stop"
                  onClick={handleStop}
                  disabled={busy}
                >
                  {busy ? 'Stopping…' : 'Stop'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="td-time-btn td-time-start"
                  onClick={handleStart}
                  disabled={busy}
                >
                  {busy ? 'Starting…' : 'Start timer'}
                </button>
                <button
                  type="button"
                  className="td-time-btn td-time-manual"
                  onClick={() => setManualOpen((v) => !v)}
                  disabled={busy}
                >
                  {manualOpen ? 'Cancel' : 'Log time…'}
                </button>
              </>
            )}
          </div>

          {manualOpen && !active && (
            <form className="td-time-manual-form" onSubmit={handleManualSubmit}>
              <label className="td-label" htmlFor="td-time-manual-mins">
                Minutes
              </label>
              <div className="td-time-manual-row">
                <input
                  id="td-time-manual-mins"
                  type="number"
                  min="1"
                  max="1440"
                  className="td-input td-time-manual-input"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="td-time-btn td-time-add"
                  disabled={busy}
                >
                  Add
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {error && <p className="dash-error td-time-error">{error}</p>}
    </section>
  );
}

export default TimeTracker;
