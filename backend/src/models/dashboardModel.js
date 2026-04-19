const pool = require('../config/db');

// Tasks the user owns + tasks shared with them.
const USER_TASKS_FROM_JOIN = `
  FROM tasks t
  LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.user_id = $1
  WHERE t.owner_id = $1 OR ts.user_id = $1
`;

async function getTaskStats(userId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int                                                              AS total,
       COUNT(*) FILTER (WHERE t.status = 'todo')::int                             AS todo,
       COUNT(*) FILTER (WHERE t.status = 'in_progress')::int                      AS in_progress,
       COUNT(*) FILTER (WHERE t.status = 'done')::int                             AS done,
       COUNT(*) FILTER (
         WHERE t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date < NOW()
       )::int                                                                      AS overdue,
       COUNT(*) FILTER (
         WHERE t.status != 'done'
           AND t.due_date IS NOT NULL
           AND t.due_date >= NOW()
           AND t.due_date <= NOW() + INTERVAL '7 days'
       )::int                                                                      AS due_this_week
     ${USER_TASKS_FROM_JOIN}`,
    [userId]
  );
  return rows[0];
}

async function getCategoryBreakdown(userId) {
  const { rows } = await pool.query(
    `SELECT c.id,
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

// Tasks completed per day for the last N days. Uses generate_series so zero-days appear.
async function getCompletionTrend(userId, days = 14) {
  const { rows } = await pool.query(
    `SELECT ds.day, COUNT(t.id)::int AS completed
     FROM generate_series(
            (NOW() - ($2 || ' days')::interval)::date,
            NOW()::date,
            '1 day'::interval
          ) AS ds(day)
     LEFT JOIN tasks t ON t.status = 'done'
                      AND DATE(t.updated_at) = ds.day
                      AND t.owner_id = $1
     GROUP BY ds.day
     ORDER BY ds.day ASC`,
    [userId, String(days)]
  );
  return rows;
}

async function getPerformanceMetrics(userId) {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(ROUND(AVG(t.time_spent) FILTER (WHERE t.status = 'done')), 0)::int
         AS avg_completion_minutes,
       COALESCE(
         ROUND(
           100.0 *
           COUNT(*) FILTER (
             WHERE t.status = 'done'
               AND t.due_date IS NOT NULL
               AND t.updated_at <= t.due_date
           ) /
           NULLIF(COUNT(*) FILTER (WHERE t.status = 'done' AND t.due_date IS NOT NULL), 0)
         ), 0
       )::int                                                                     AS on_time_rate,
       COUNT(*) FILTER (
         WHERE t.status = 'done' AND t.updated_at >= NOW() - INTERVAL '7 days'
       )::int                                                                     AS completed_this_week,
       COUNT(*) FILTER (
         WHERE t.status = 'done'
           AND t.updated_at >= NOW() - INTERVAL '14 days'
           AND t.updated_at <  NOW() - INTERVAL '7 days'
       )::int                                                                     AS completed_last_week,
       COUNT(*)::int                                                              AS total_tasks
     ${USER_TASKS_FROM_JOIN}`,
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
