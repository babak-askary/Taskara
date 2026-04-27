import { useEffect, useState } from 'react';

// Returns a value that lags `value` by `delay` ms. Useful for search inputs:
//   const debounced = useDebounce(searchInput, 300);
//   useEffect(() => { fetch(debounced); }, [debounced]);
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
