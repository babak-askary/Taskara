import { useEffect, useState } from 'react';
import {
  getTaskById,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
} from '../api/taskApi';
import { errorMessage } from '../api/client';

// Loads a task by id, exposes load state, and gives back patch / delete
// operations that handle the optimistic-update + rollback pattern. Used
// by TaskDetailPage so the page itself can focus on rendering.
export function useTaskEditor(id, isAuthenticated) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [spawnedNotice, setSpawnedNotice] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);

    getTaskById(id)
      .then((res) => {
        if (cancelled) return;
        setTask(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 404) setNotFound(true);
        else setLoadError(errorMessage(err, 'Could not load task.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id, isAuthenticated]);

  // Optimistic patch — mutate UI now, rollback if the server rejects.
  // Returns the error message on failure, null on success.
  async function patch(fields) {
    const prev = task;
    setTask((t) => ({ ...t, ...fields }));
    setSaving(true);
    try {
      const { data } = await apiUpdateTask(id, fields);
      const { spawned, ...rest } = data;
      setTask((t) => ({ ...t, ...rest }));
      if (spawned?.id) setSpawnedNotice(spawned);
      return null;
    } catch (err) {
      setTask(prev);
      return errorMessage(err, 'Could not save change.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    return apiDeleteTask(id);
  }

  function applyExternal(updates) {
    setTask((t) => ({ ...t, ...updates }));
  }

  return {
    task, setTask,
    loading, loadError, notFound,
    saving,
    spawnedNotice, dismissSpawnNotice: () => setSpawnedNotice(null),
    patch, remove, applyExternal,
  };
}
