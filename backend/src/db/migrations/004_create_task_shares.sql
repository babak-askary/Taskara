CREATE TABLE task_shares (
  id         SERIAL PRIMARY KEY,
  task_id    INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(10) DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_shares_user_id ON task_shares(user_id);
