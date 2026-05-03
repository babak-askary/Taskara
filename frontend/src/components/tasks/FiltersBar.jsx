import { STATUS_CHIPS, PRIORITY_OPTIONS, SORT_OPTIONS } from '../../constants/taskOptions';

function FiltersBar({
  searchInput, setSearchInput,
  status, setStatus,
  priority, setPriority,
  categoryId, setCategoryId,
  sort, setSort,
  categories,
  hasFilters, onClear,
}) {
  return (
    <section className="tasks-toolbar">
      <div className="tasks-search">
        <svg
          className="tasks-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          className="tasks-search-input"
          type="search"
          placeholder="Search tasks…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="tasks-chips">
        {STATUS_CHIPS.map((s) => (
          <button
            key={s.value || 'all'}
            type="button"
            className={`tasks-chip ${status === s.value ? 'is-active' : ''}`}
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="tasks-selects">
        <select
          className="tasks-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Priority filter"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value || 'all'} value={p.value}>{p.label}</option>
          ))}
        </select>

        {categories.length > 0 && (
          <select
            className="tasks-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Category filter"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <select
          className="tasks-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort order"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>Sort: {s.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button type="button" className="tasks-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </section>
  );
}

export default FiltersBar;
