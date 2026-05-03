-- One row per chat. group_id is set for group chats (UNIQUE so a group has
-- exactly one conversation). For direct chats group_id is NULL and the two
-- participants live in conversation_participants.
CREATE TABLE conversations (
  id         SERIAL PRIMARY KEY,
  kind       VARCHAR(10) NOT NULL CHECK (kind IN ('group', 'direct')),
  group_id   INT UNIQUE REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_group_id ON conversations(group_id);

-- Backfill: every existing group gets a conversation. New groups get one
-- via the controller; this catches anything that already exists.
INSERT INTO conversations (kind, group_id)
SELECT 'group', g.id FROM groups g
WHERE NOT EXISTS (SELECT 1 FROM conversations WHERE group_id = g.id);
