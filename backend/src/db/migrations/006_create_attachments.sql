CREATE TABLE attachments (
  id           SERIAL PRIMARY KEY,
  task_id      INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name    VARCHAR(255) NOT NULL,
  file_url     TEXT NOT NULL,
  file_size    INT,
  mime_type    VARCHAR(100),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_task_id ON attachments(task_id);
