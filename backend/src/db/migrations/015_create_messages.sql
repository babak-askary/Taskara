CREATE TABLE messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Reading a thread is "messages for this conversation, newest first or
-- oldest first with limit". Composite index covers both.
CREATE INDEX idx_messages_conv_created ON messages(conversation_id, created_at DESC);
