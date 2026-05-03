import { useEffect, useState } from 'react';
import { getStats, getPerformance } from '../api/dashboardApi';
import { getTasks } from '../api/taskApi';
import { errorMessage } from '../api/client';

// Loads everything the dashboard renders (stats + categories + perf
// metrics + trend + tasks) in a single Promise.all on mount. Returns
// { loading, error, stats, categories, perf, trend, tasks }.
export function useDashboardData(isAuthenticated) {
  const [data, setData] = useState({
    stats: null,
    categories: [],
    perf: null,
    trend: [],
    tasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [s, p, t] = await Promise.all([getStats(), getPerformance(), getTasks()]);
        if (cancelled) return;
        setData({
          stats: s.data.stats,
          categories: s.data.category_breakdown || [],
          perf: p.data.metrics,
          trend: p.data.trend || [],
          tasks: t.data || [],
        });
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load your dashboard.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  return { ...data, loading, error };
}
