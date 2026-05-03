const pool = require('../config/db');

const COLUMNS = 'id, task_id, uploaded_by, file_name, file_url, file_size, mime_type, public_id, resource_type, created_at';

async function create({ taskId, uploadedBy, fileName, fileUrl, fileSize, mimeType, publicId, resourceType }) {
  const { rows } = await pool.query(
    `INSERT INTO attachments
       (task_id, uploaded_by, file_name, file_url, file_size, mime_type, public_id, resource_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${COLUMNS}`,
    [taskId, uploadedBy, fileName, fileUrl, fileSize, mimeType, publicId, resourceType]
  );
  return rows[0];
}

async function findByTask(taskId) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS.split(', ').map(c => `a.${c}`).join(', ')},
            u.name AS uploader_name, u.email AS uploader_email
     FROM attachments a
     LEFT JOIN users u ON u.id = a.uploaded_by
     WHERE a.task_id = $1
     ORDER BY a.created_at DESC`,
    [taskId]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM attachments WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM attachments WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { create, findByTask, findById, remove };
