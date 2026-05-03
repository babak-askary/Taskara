-- Group tasks: a task with a non-null group_id belongs to that group.
-- The existing tasks.owner_id continues to mean "the user this task is for"
-- (the assignee, in group context), so the rest of the app's "my tasks"
-- queries pick up group tasks for free.
ALTER TABLE tasks
  ADD COLUMN group_id INT REFERENCES groups(id) ON DELETE CASCADE;

CREATE INDEX idx_tasks_group_id ON tasks(group_id);
