const pool = require('../config/db');

// Overall task counts by status + overdue + due-this-week.
// Includes tasks the user owns and tasks shared with them.
async function getTaskStats(userId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE t.status = 'todo')::int        AS todo,
       COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
       COUNT(*) FILTER (WHERE t.status = 'done')::int        AS done,
       COUNT(*) FILTER (
         WHERE t.status != 'done'
           AND t.due_date IS NOT NULL
           AND t.due_date < NOW()
       )::int AS overdue,
       COUNT(*) FILTER (
         WHERE t.status != 'done'
           AND t.due_date IS NOT NULL
           AND t.due_date >= NOW()
           AND t.due_date <= NOW() + INTERVAL '7 days'
       )::int AS due_this_week
     FROM tasks t
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $1
     WHERE t.owner_id = $1 OR ts.user_id = $1`,
    [userId]
  );
  return rows[0];
}

// Task count per category (null means "uncategorized")
async function getCategoryBreakdown(userId) {
  const { rows } = await pool.query(
    `SELECT
       c.id,
       COALESCE(c.name, 'Uncategorized') AS name,
       COALESCE(c.color, '#9ca3af')      AS color,
       COUNT(t.id)::int                   AS count
     FROM tasks t
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $1
     LEFT JOIN categories c   ON c.id = t.category_id
     WHERE t.owner_id = $1 OR ts.user_id = $1
     GROUP BY c.id, c.name, c.color
     ORDER BY count DESC`,
    [userId]
  );
  return rows;
}

// Tasks completed per day for the last N days (for line chart).
// Uses updated_at as proxy for completion timestamp when status = 'done'.
async function getCompletionTrend(userId, days = 14) {
  const { rows } = await pool.query(
    `WITH date_series AS (
       SELECT generate_series(
         (NOW() - ($2 || ' days')::interval)::date,
         NOW()::date,
         '1 day'::interval
       )::date AS day
     )
     SELECT
       ds.day,
       COUNT(t.id)::int AS completed
     FROM date_series ds
     LEFT JOIN tasks t ON t.status = 'done'
                      AND DATE(t.updated_at) = ds.day
                      AND t.owner_id = $1
     GROUP BY ds.day
     ORDER BY ds.day ASC`,
    [userId, String(days)]
  );
  return rows;
}

// Performance metrics for the authenticated user.
async function getPerformanceMetrics(userId) {
  const { rows } = await pool.query(
    `WITH user_tasks AS (
       SELECT t.*
       FROM tasks t
       LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $1
       WHERE t.owner_id = $1 OR ts.user_id = $1
     ),
     completed AS (
       SELECT * FROM user_tasks WHERE status = 'done'
     )
     SELECT
       -- Avg time spent on completed tasks (minutes)
       COALESCE(ROUND(AVG(time_spent) FILTER (WHERE status = 'done')), 0)::int AS avg_completion_minutes,

       -- On-time completion rate: of completed tasks with a due_date,
       -- how many finished on or before due_date
       COALESCE(
         ROUND(
           100.0 *
           COUNT(*) FILTER (
             WHERE status = 'done'
               AND due_date IS NOT NULL
               AND updated_at <= due_date
           ) /
           NULLIF(COUNT(*) FILTER (WHERE status = 'done' AND due_date IS NOT NULL), 0)
         ), 0
       )::int AS on_time_rate,

       -- Counts
       COUNT(*) FILTER (
         WHERE status = 'done' AND updated_at >= NOW() - INTERVAL '7 days'
       )::int AS completed_this_week,
       COUNT(*) FILTER (
         WHERE status = 'done'
           AND updated_at >= NOW() - INTERVAL '14 days'
           AND updated_at <  NOW() - INTERVAL '7 days'
       )::int AS completed_last_week,
       COUNT(*)::int AS total_tasks
     FROM user_tasks`,
    [userId]
  );
  return rows[0];
}

module.exports = {
  getTaskStats,
  getCategoryBreakdown,
  getCompletionTrend,
  getPerformanceMetrics,
};
