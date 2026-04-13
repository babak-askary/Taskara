CREATE TABLE comments (
  id         SERIAL PRIMARY KEY,
  task_id    INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_task_id ON comments(task_id);
