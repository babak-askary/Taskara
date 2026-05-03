import { useState } from 'react';
import { useDebounce } from './useDebounce';

// All task-list filter state in one place. Returns the values, the
// setters, the debounced search term, a clear helper, and a derived
// hasFilters flag for the "Clear" button.
export function useTaskFilters() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('due_date:ASC');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput.trim(), 300);

  function clear() {
    setStatus('');
    setPriority('');
    setCategoryId('');
    setSearchInput('');
  }

  return {
    status, setStatus,
    priority, setPriority,
    categoryId, setCategoryId,
    sort, setSort,
    searchInput, setSearchInput,
    search,
    clear,
    hasFilters: Boolean(status || priority || categoryId || search),
  };
}
