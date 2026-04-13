import { useState, useMemo } from 'react';
import { useTasks } from '../context/TaskContext.jsx';
import { TaskCard } from '../components/TaskCard.jsx';
import { TaskFilters } from '../components/TaskFilters.jsx';
import { TaskForm } from '../components/TaskForm.jsx';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  category: '',
  priority: '',
  sort: 'newest',
};

export function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState('grid');
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    let result = [...tasks];

    // Text search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q),
      );
    }

    // Status
    if (filters.status) result = result.filter(t => t.status === filters.status);

    // Category
    if (filters.category) result = result.filter(t => t.category === filters.category);

    // Priority
    if (filters.priority) result = result.filter(t => t.priority === filters.priority);

    // Sort
    switch (filters.sort) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'deadline':
        result.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
        break;
      case 'priority':
        result.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default: // newest
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [tasks, filters]);

  const handleSave = (formData) => {
    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      addTask(formData);
    }
    setShowForm(false);
    setEditingTask(null);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleToggleStatus = (task) => {
    const next =
      task.status === 'todo'
        ? 'in-progress'
        : task.status === 'in-progress'
        ? 'completed'
        : 'todo';
    updateTask(task.id, { status: next });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const openNew = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  return (
    <div className="page tasks-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage and track all your tasks</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Task</button>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        total={filtered.length}
      />

      {/* Task grid / list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No tasks found</h3>
          <p>
            {tasks.length === 0
              ? 'Get started by creating your first task!'
              : 'Try adjusting your filters.'}
          </p>
          {tasks.length === 0 && (
            <button className="btn btn-primary" onClick={openNew}>Create Task</button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'task-grid' : 'task-list'}>
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={deleteTask}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Floating add button (mobile) */}
      <button className="fab" onClick={openNew} aria-label="New task">+</button>

      {showForm && (
        <TaskForm key={editingTask?.id || 'new'} task={editingTask} onSave={handleSave} onClose={handleCloseForm} />
      )}
    </div>
  );
}
