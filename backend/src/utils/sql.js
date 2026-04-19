// Small SQL helpers that replace the duplicated dynamic-query patterns
// across model files. No dependencies — just string assembly + parameter arrays.

// Build an UPDATE statement from a plain fields object.
//   buildUpdate('tasks', 42, { status: 'done' }, ['status', 'title'])
//   -> { text: 'UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', values: ['done', 42] }
//
// Returns null if there is nothing to update (caller can just return the row).
function buildUpdate(table, id, fields, allowed, { touchUpdatedAt = true } = {}) {
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }

  if (sets.length === 0) return null;

  if (touchUpdatedAt) sets.push('updated_at = NOW()');
  values.push(id);

  return {
    text: `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  };
}

// Build a WHERE clause from an array of conditions.
// Each condition is { sql, value } or { sql, values } and uses '?' placeholders.
// Null/undefined conditions are skipped (handy for optional filters).
//   buildWhere([
//     { sql: 'owner_id = ?', value: userId },
//     status ? { sql: 'status = ?', value: status } : null,
//   ])
//   -> { clause: 'WHERE owner_id = $1 AND status = $2', values: [userId, status] }
function buildWhere(conditions) {
  const values = [];
  const parts = [];

  for (const c of conditions) {
    if (c == null) continue;
    const vs = Array.isArray(c.values) ? c.values : c.value !== undefined ? [c.value] : [];
    let sql = c.sql;
    for (const v of vs) {
      values.push(v);
      sql = sql.replace('?', `$${values.length}`);
    }
    parts.push(sql);
  }

  return {
    clause: parts.length ? `WHERE ${parts.join(' AND ')}` : '',
    values,
  };
}

module.exports = { buildUpdate, buildWhere };
