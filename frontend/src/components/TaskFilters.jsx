const CATEGORIES = ['Work', 'Personal', 'Health', 'Shopping', 'Education', 'Other'];

export function TaskFilters({ filters, onChange, viewMode, onViewModeChange, total }) {
  const set = (field) => (e) => onChange({ ...filters, [field]: e.target.value });
  const reset = () =>
    onChange({ search: '', status: '', category: '', priority: '', sort: 'newest' });

  const hasActive =
    filters.search || filters.status || filters.category || filters.priority;

  return (
    <div className="task-filters">
      {/* Search */}
      <div className="filter-search-wrap">
        <span className="filter-search-icon">🔍</span>
        <input
          className="filter-search"
          type="search"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={set('search')}
          aria-label="Search tasks"
        />
      </div>

      {/* Status */}
      <select className="filter-select" value={filters.status} onChange={set('status')} aria-label="Filter by status">
        <option value="">All Statuses</option>
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      {/* Category */}
      <select className="filter-select" value={filters.category} onChange={set('category')} aria-label="Filter by category">
        <option value="">All Categories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Priority */}
      <select className="filter-select" value={filters.priority} onChange={set('priority')} aria-label="Filter by priority">
        <option value="">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Sort */}
      <select className="filter-select" value={filters.sort} onChange={set('sort')} aria-label="Sort tasks">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="deadline">Deadline</option>
        <option value="priority">Priority</option>
        <option value="title">Title A–Z</option>
      </select>

      {/* View toggle */}
      <div className="view-toggle">
        <button
          className={`view-btn${viewMode === 'grid' ? ' active' : ''}`}
          onClick={() => onViewModeChange('grid')}
          title="Grid view"
          aria-pressed={viewMode === 'grid'}
        >⊞</button>
        <button
          className={`view-btn${viewMode === 'list' ? ' active' : ''}`}
          onClick={() => onViewModeChange('list')}
          title="List view"
          aria-pressed={viewMode === 'list'}
        >☰</button>
      </div>

      {/* Clear + count */}
      <div className="filter-meta">
        <span className="filter-count">{total} task{total !== 1 ? 's' : ''}</span>
        {hasActive && (
          <button className="btn btn-ghost btn-sm" onClick={reset}>Clear filters</button>
        )}
      </div>
    </div>
  );
}
