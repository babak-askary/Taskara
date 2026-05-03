CREATE TABLE time_entries (
  id               SERIAL PRIMARY KEY,
  task_id          INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  duration_minutes INT,
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);

-- Only one active (un-stopped) timer per user per task
CREATE UNIQUE INDEX idx_time_entries_active_one_per_user_task
  ON time_entries(task_id, user_id)
  WHERE ended_at IS NULL;
