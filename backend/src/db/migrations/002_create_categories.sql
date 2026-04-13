CREATE TABLE categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(7) DEFAULT '#6366f1',
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
