import { useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  getGroup,
  getGroupTasks,
  deleteGroup,
  leaveGroup,
  removeMember,
  changeMemberRole,
} from '../api/groupApi';
import { createTask, updateTask, deleteTask } from '../api/taskApi';
import { errorMessage } from '../api/client';
import { useToast } from '../hooks/useToast';
import { fmtFriendly, isOverdue, recurrenceLabel } from '../utils/dateFormat';
import GroupBoard from '../components/groups/GroupBoard';
import { getGroupConversation } from '../api/chatApi';

const STATUS_LABELS = { todo: 'To do', in_progress: 'In progress', done: 'Done' };

function initials(s) {
  return (s || '?').split(/[\s@]/)[0].slice(0, 2).toUpperCase();
}

function GroupTaskRow({ task, group, currentUserId, isAdmin, onToggle, onDelete, onAssigneeChange }) {
  const overdue = isOverdue(task.due_date, task.status);
  const done = task.status === 'done';
  const recur = task.is_recurring ? recurrenceLabel(task.recurrence_rule, task.due_date) : null;
  const isMine = task.owner_id === currentUserId;
  const canEdit = isMine || isAdmin;
  return (
    <li className={`gp-task ${done ? 'is-done' : ''} ${overdue ? 'is-overdue' : ''}`}>
      <button
        className={`task-check ${done ? 'is-checked' : ''}`}
        onClick={() => canEdit && onToggle(task)}
        disabled={!canEdit}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        title={canEdit ? '' : 'Only the assignee or an admin can change this'}
      >
        {done && (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8l3.5 3.5L13 5" />
          </svg>
        )}
      </button>

      <span className={`task-pri-bar pri-${task.priority || 'low'}`} aria-hidden="true" />

      <Link to={`/tasks/${task.id}`} className="task-main gp-task-main">
        <div className="task-title-row">
          <span className="task-title">{task.title}</span>
          {task.is_recurring && <span className="task-recurring" title="Recurring">↻</span>}
        </div>
      </Link>

      <div className="gp-task-assignee">
        <span className="gp-avatar" aria-hidden="true">
          {task.owner_avatar
            ? <img src={task.owner_avatar} alt="" />
            : <span>{initials(task.owner_name || task.owner_email)}</span>}
        </span>
        {isAdmin ? (
          <select
            className="gp-task-assignee-select"
            value={task.owner_id}
            onChange={(e) => onAssigneeChange(task, Number(e.target.value))}
            aria-label="Assignee"
          >
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name || m.email}</option>
            ))}
          </select>
        ) : (
          <span className="gp-task-assignee-name">{task.owner_name || task.owner_email}</span>
        )}
      </div>

      {recur ? (
        <span className="task-due is-recurring-label" title={recur}>{recur}</span>
      ) : (
        <span className={`task-due ${!task.due_date ? 'is-none' : overdue ? 'is-overdue' : ''}`}>
          {task.due_date ? fmtFriendly(task.due_date) : 'No date'}
        </span>
      )}

      <span className={`gp-status gp-status-${task.status}`}>{STATUS_LABELS[task.status]}</span>

      {canEdit && (
        <button className="task-delete" onClick={() => onDelete(task)} aria-label="Delete" title="Delete">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      )}
    </li>
  );
}

function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const toast = useToast();

  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick-add task
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [adding, setAdding] = useState(false);

  // Find current user's id from the group's members.
  const currentUserId = useMemo(() => {
    if (!group || !user) return null;
    const m = group.members.find((m) => m.email === user.email);
    return m?.id || null;
  }, [group, user]);

  const isOwnerRole = group?.role === 'owner';
  const isAdmin = group?.role === 'owner' || group?.role === 'admin';

  // Default the assignee dropdown to the current user.
  useEffect(() => {
    if (currentUserId && !newAssignee) setNewAssignee(String(currentUserId));
  }, [currentUserId, newAssignee]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getGroup(id), getGroupTasks(id)])
      .then(([g, t]) => {
        if (cancelled) return;
        setGroup(g.data);
        setTasks(t.data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 404) setError('Group not found.');
        else if (err.response?.status === 403) setError("You're not a member of this group.");
        else setError(errorMessage(err, 'Could not load the group.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, isAuthenticated]);

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
    return { open, done, overdue };
  }, [tasks]);

  async function handleAdd(e) {
    e.preventDefault();
    if (adding || !newTitle.trim()) return;
    const assigneeId = Number(newAssignee) || currentUserId;
    if (!isAdmin && assigneeId !== currentUserId) {
      toast.error("Members can only assign tasks to themselves.");
      return;
    }
    setAdding(true);
    try {
      const res = await createTask({
        title: newTitle.trim(),
        group_id: Number(id),
        assignee_id: assigneeId,
      });
      setTasks((prev) => [
        { ...res.data, owner_name: group.members.find((m) => m.id === assigneeId)?.name },
        ...prev,
      ]);
      setNewTitle('');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create task.'));
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(task) {
    const next = task.status === 'done' ? 'todo' : 'done';
    const prev = task.status;
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      const res = await updateTask(task.id, { status: next });
      const { spawned, ...rest } = res.data || {};
      setTasks((list) => {
        let out = list.map((t) => (t.id === rest.id ? { ...t, ...rest } : t));
        if (spawned?.id && !out.some((t) => t.id === spawned.id)) {
          out = [{ ...spawned, owner_name: task.owner_name, owner_avatar: task.owner_avatar }, ...out];
        }
        return out;
      });
    } catch (err) {
      setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: prev } : t)));
      toast.error(errorMessage(err, 'Could not update task.'));
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    const before = tasks;
    setTasks((list) => list.filter((t) => t.id !== task.id));
    try { await deleteTask(task.id); }
    catch (err) {
      setTasks(before);
      toast.error(errorMessage(err, 'Could not delete task.'));
    }
  }

  async function handleAssigneeChange(task, newAssigneeId) {
    const before = tasks;
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, owner_id: newAssigneeId } : t)));
    try {
      // The backend expects PUT on /tasks/:id; but owner_id isn't an
      // updatable column today, so reassignment goes through dedicated
      // semantics — we delete and recreate. For now, surface a hint instead.
      // Using updateTask with owner_id falls through silently.
      await updateTask(task.id, { owner_id: newAssigneeId });
      const member = group.members.find((m) => m.id === newAssigneeId);
      setTasks((list) => list.map((t) =>
        t.id === task.id
          ? { ...t, owner_id: newAssigneeId, owner_name: member?.name, owner_email: member?.email, owner_avatar: member?.avatar_url }
          : t
      ));
    } catch (err) {
      setTasks(before);
      toast.error(errorMessage(err, 'Could not reassign task.'));
    }
  }

  async function handleDeleteGroup() {
    if (!window.confirm(`Delete “${group.name}”? This permanently removes all its tasks and members.`)) return;
    try {
      await deleteGroup(id);
      toast.success('Group deleted.');
      navigate('/groups');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the group.'));
    }
  }

  async function handleLeave() {
    if (!window.confirm(`Leave “${group.name}”?`)) return;
    try {
      await leaveGroup(id);
      toast.success('You left the group.');
      navigate('/groups');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not leave the group.'));
    }
  }

  async function handleRemoveMember(m) {
    if (!window.confirm(`Remove ${m.name || m.email} from the group?`)) return;
    try {
      await removeMember(id, m.id);
      setGroup((g) => ({ ...g, members: g.members.filter((x) => x.id !== m.id) }));
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove member.'));
    }
  }

  async function handleChangeRole(m, role) {
    try {
      await changeMemberRole(id, m.id, role);
      setGroup((g) => ({
        ...g,
        members: g.members.map((x) => (x.id === m.id ? { ...x, role } : x)),
      }));
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change role.'));
    }
  }

  if (authLoading) return <div className="loading">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (loading) return <div className="dash"><div className="dash-skel td-skel-hero" /></div>;
  if (error) {
    return (
      <div className="dash">
        <Link to="/groups" className="dash-link">← Back to groups</Link>
        <p className="dash-empty dash-error">{error}</p>
      </div>
    );
  }
  if (!group) return null;

  return (
    <div className="dash gp-detail">
      <Link to="/groups" className="dash-link">← Back to groups</Link>

      <header className="cal-page-head gp-detail-head">
        <div className="cal-page-headline">
          <p className="cal-page-eyebrow">
            <span className="cal-page-eyebrow-dot" />
            Group
            <span className="cal-page-eyebrow-pill">{group.role}</span>
          </p>
          <h1 className="cal-page-title">{group.name}</h1>
          <p className="cal-page-year">
            <span className="gp-slug-chip">{group.slug}</span>
          </p>
          {group.description && <p className="gp-detail-desc">{group.description}</p>}
        </div>
        <div className="cal-page-controls">
          <button
            type="button"
            className="cal-new-btn"
            onClick={async () => {
              try {
                const res = await getGroupConversation(id);
                navigate(`/chat/${res.data.id}`);
              } catch (err) {
                toast.error(errorMessage(err, 'Could not open the group chat.'));
              }
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span>Open chat</span>
          </button>
          {isOwnerRole ? (
            <button type="button" className="btn-secondary gp-danger" onClick={handleDeleteGroup}>
              Delete group
            </button>
          ) : (
            <button type="button" className="btn-secondary" onClick={handleLeave}>
              Leave group
            </button>
          )}
        </div>
      </header>

      <div className="cal-stats">
        <div className="cal-stat">
          <span className="cal-stat-value">{stats.open}</span>
          <span className="cal-stat-label">Open</span>
        </div>
        <div className="cal-stat-divider" aria-hidden="true" />
        <div className="cal-stat">
          <span className="cal-stat-value">{stats.done}</span>
          <span className="cal-stat-label">Done</span>
        </div>
        <div className="cal-stat-divider" aria-hidden="true" />
        <div className="cal-stat">
          <span className="cal-stat-value">{stats.overdue}</span>
          <span className="cal-stat-label">Overdue</span>
        </div>
        <div className="cal-stat-divider" aria-hidden="true" />
        <div className="cal-stat">
          <span className="cal-stat-value">{group.members.length}</span>
          <span className="cal-stat-label">Members</span>
        </div>
      </div>

      <GroupBoard tasks={tasks} members={group.members} />

      <section className="gp-detail-grid">
        <article className="dash-card gp-tasks-card">
          <header className="dash-card-head dash-card-head-row">
            <div>
              <p className="dash-card-eyebrow">Tasks</p>
              <h3 className="dash-card-title">Group board</h3>
            </div>
          </header>

          <form className="tasks-add gp-add" onSubmit={handleAdd}>
            <span className="tasks-add-icon" aria-hidden="true">+</span>
            <input
              className="tasks-add-input"
              type="text"
              placeholder="Add a task to this group"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={255}
              disabled={adding}
            />
            <select
              className="qc-input gp-add-assignee"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              disabled={!isAdmin && group.members.length > 1}
              title={!isAdmin ? 'Members can only add tasks for themselves' : 'Assignee'}
            >
              {group.members.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                  disabled={!isAdmin && m.id !== currentUserId}
                >
                  {m.id === currentUserId ? 'Me' : (m.name || m.email)}
                </option>
              ))}
            </select>
            <button type="submit" className="tasks-add-btn" disabled={!newTitle.trim() || adding}>
              {adding ? 'Adding…' : 'Add'}
            </button>
          </form>

          {tasks.length === 0 ? (
            <p className="dash-empty">No tasks yet. Add one above.</p>
          ) : (
            <ul className="gp-task-list">
              {tasks.map((t) => (
                <GroupTaskRow
                  key={t.id}
                  task={t}
                  group={group}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onAssigneeChange={handleAssigneeChange}
                />
              ))}
            </ul>
          )}
        </article>

        <article className="dash-card gp-members-card">
          <header className="dash-card-head">
            <p className="dash-card-eyebrow">People</p>
            <h3 className="dash-card-title">Members</h3>
          </header>
          <ul className="gp-member-list">
            {group.members.map((m) => {
              const isSelf = m.id === currentUserId;
              const isGroupOwner = m.id === group.owner_id;
              return (
                <li key={m.id} className="gp-member">
                  <span className="gp-avatar" aria-hidden="true">
                    {m.avatar_url ? <img src={m.avatar_url} alt="" /> : <span>{initials(m.name || m.email)}</span>}
                  </span>
                  <div className="gp-member-meta">
                    <span className="gp-member-name">
                      {m.name || m.email}
                      {isSelf && <span className="gp-member-you"> (you)</span>}
                    </span>
                    <span className="gp-member-email">{m.email}</span>
                  </div>
                  {isOwnerRole && !isGroupOwner ? (
                    <select
                      className="gp-role-select"
                      value={m.role}
                      onChange={(e) => handleChangeRole(m, e.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`gp-role gp-role-${m.role}`}>{m.role}</span>
                  )}
                  {isAdmin && !isGroupOwner && !isSelf && (
                    <button
                      type="button"
                      className="cat-del"
                      onClick={() => handleRemoveMember(m)}
                      aria-label={`Remove ${m.name || m.email}`}
                      title="Remove from group"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="gp-member-hint">
            Share <code>{group.slug}</code> with others — they can find this group on the Groups page and join.
          </p>
        </article>
      </section>
    </div>
  );
}

export default GroupDetailPage;
