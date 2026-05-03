-- Used for direct chats (2 rows per conversation). Group chats don't need
-- participant rows because access is via group_members instead.
CREATE TABLE conversation_participants (
  id              SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_cp_user_id ON conversation_participants(user_id);
CREATE INDEX idx_cp_conv_id ON conversation_participants(conversation_id);
