CREATE TABLE tasks (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority        VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date        TIMESTAMPTZ,
  category_id     INT REFERENCES categories(id) ON DELETE SET NULL,
  owner_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_recurring    BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(100),
  time_spent      INT DEFAULT 0,
  estimated_time  INT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
