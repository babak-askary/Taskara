import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../context/TaskContext.jsx';
import { useAppAuth } from '../context/AuthContext.jsx';
import { ProgressStats } from '../components/ProgressStats.jsx';
import { TaskForm } from '../components/TaskForm.jsx';
import { formatShortDate, isOverdue } from '../utils/formatters.js';

const STATUS_META = {
  todo: { label: 'To Do', cls: 'badge-todo' },
  'in-progress': { label: 'In Progress', cls: 'badge-progress' },
  completed: { label: 'Done', cls: 'badge-done' },
};

const PRIORITY_META = {
  low: { label: 'Low', cls: 'badge-low' },
  medium: { label: 'Medium', cls: 'badge-medium' },
  high: { label: 'High', cls: 'badge-high' },
};

export function DashboardPage() {
  const { tasks, addTask } = useTasks();
  const { user } = useAppAuth();
  const [showForm, setShowForm] = useState(false);

  const now = new Date();
  const upcoming = tasks
    .filter(t => t.deadline && t.status !== 'completed' && new Date(t.deadline + 'T00:00:00') >= now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  const recent = [...tasks]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  const handleSave = (formData) => {
    addTask(formData);
    setShowForm(false);
  };

  return (
    <div className="page dashboard-page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New Task
        </button>
      </div>

      {/* Stats + charts */}
      <ProgressStats tasks={tasks} />

      {/* Two-column section */}
      <div className="dashboard-bottom">
        {/* Recent tasks */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Tasks</h2>
            <Link to="/tasks" className="section-link">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <p>No tasks yet. <button className="link-btn" onClick={() => setShowForm(true)}>Create your first task!</button></p>
            </div>
          ) : (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(t => {
                  const overdue = isOverdue(t.deadline, t.status);
                  return (
                    <tr key={t.id} className="task-row">
                      <td>
                        <Link to={`/tasks/${t.id}`} className="task-row-title">
                          {t.title}
                        </Link>
                        <span className="task-row-cat">{t.category}</span>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_META[t.status]?.cls || ''}`}>
                          {STATUS_META[t.status]?.label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${PRIORITY_META[t.priority]?.cls || ''}`}>
                          {PRIORITY_META[t.priority]?.label}
                        </span>
                      </td>
                      <td className={overdue ? 'text-danger' : ''}>
                        {formatShortDate(t.deadline)}
                        {overdue && <span className="overdue-tag"> ⚠️</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Upcoming deadlines */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Upcoming Deadlines</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="empty-state-sm">No upcoming deadlines 🎉</p>
          ) : (
            <ul className="deadline-list">
              {upcoming.map(t => {
                const daysLeft = Math.ceil(
                  (new Date(t.deadline + 'T00:00:00') - now) / 86_400_000,
                );
                return (
                  <li key={t.id} className="deadline-item">
                    <Link to={`/tasks/${t.id}`} className="deadline-title">{t.title}</Link>
                    <div className="deadline-meta">
                      <span className={`badge ${PRIORITY_META[t.priority]?.cls || ''}`}>{PRIORITY_META[t.priority]?.label}</span>
                      <span className={`deadline-days${daysLeft <= 1 ? ' urgent' : ''}`}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {showForm && (
        <TaskForm key="dashboard-new" onSave={handleSave} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
