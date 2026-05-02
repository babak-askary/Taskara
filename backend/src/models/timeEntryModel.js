const pool = require('../config/db');

// Active = a timer that was started but not yet stopped.
async function findActive(taskId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM time_entries
     WHERE task_id = $1 AND user_id = $2 AND ended_at IS NULL
     LIMIT 1`,
    [taskId, userId]
  );
  return rows[0] || null;
}

async function listForTask(taskId) {
  const { rows } = await pool.query(
    `SELECT te.*, u.name AS user_name, u.email AS user_email
     FROM time_entries te
     LEFT JOIN users u ON u.id = te.user_id
     WHERE te.task_id = $1
     ORDER BY te.started_at DESC`,
    [taskId]
  );
  return rows;
}

async function startTimer(taskId, userId) {
  const { rows } = await pool.query(
    `INSERT INTO time_entries (task_id, user_id) VALUES ($1, $2) RETURNING *`,
    [taskId, userId]
  );
  return rows[0];
}

// Stops the active timer, computes duration in minutes, increments
// tasks.time_spent atomically. Returns the updated task or null if no
// active timer existed.
async function stopTimer(taskId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: active } = await client.query(
      `SELECT id, started_at FROM time_entries
       WHERE task_id = $1 AND user_id = $2 AND ended_at IS NULL
       LIMIT 1
       FOR UPDATE`,
      [taskId, userId]
    );
    if (active.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const entry = active[0];
    const startedAt = new Date(entry.started_at).getTime();
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));

    await client.query(
      `UPDATE time_entries
       SET ended_at = NOW(), duration_minutes = $1
       WHERE id = $2`,
      [minutes, entry.id]
    );
    const { rows: updatedTask } = await client.query(
      `UPDATE tasks SET time_spent = COALESCE(time_spent, 0) + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [minutes, taskId]
    );

    await client.query('COMMIT');
    return { entry: { ...entry, duration_minutes: minutes }, task: updatedTask[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Manual entry: a fully-formed entry with duration_minutes already known.
async function addManual(taskId, userId, minutes, note = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const startedAt = new Date(Date.now() - minutes * 60000);
    const { rows: entryRows } = await client.query(
      `INSERT INTO time_entries (task_id, user_id, started_at, ended_at, duration_minutes, note)
       VALUES ($1, $2, $3, NOW(), $4, $5)
       RETURNING *`,
      [taskId, userId, startedAt, minutes, note]
    );
    const { rows: taskRows } = await client.query(
      `UPDATE tasks SET time_spent = COALESCE(time_spent, 0) + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [minutes, taskId]
    );

    await client.query('COMMIT');
    return { entry: entryRows[0], task: taskRows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { findActive, listForTask, startTimer, stopTimer, addManual };
