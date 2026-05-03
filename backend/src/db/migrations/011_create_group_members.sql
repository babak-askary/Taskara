CREATE TABLE group_members (
  id        SERIAL PRIMARY KEY,
  group_id  INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      VARCHAR(10) NOT NULL DEFAULT 'member'
            CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_user_id  ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
