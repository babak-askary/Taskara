const attachmentModel = require('../models/attachmentModel');
const taskModel = require('../models/taskModel');
const cloudinaryService = require('../services/cloudinaryService');
const parseId = require('../utils/parseId');

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// POST /api/tasks/:id/attachments — multipart with `file`
async function uploadAttachment(req, res, next) {
  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ message: 'File uploads are not configured on the server.' });
    }
    const taskId = parseId(req.params.id);
    if (taskId === null) return res.status(400).json({ message: 'Invalid task id' });
    if (!(await taskModel.isOwnerOrEditor(taskId, req.user.id))) {
      return res.status(403).json({ message: 'You need edit access to attach files.' });
    }
    if (!req.file) {
      return res.status(400).json({ errors: ['file is required'] });
    }
    if (req.file.size > MAX_BYTES) {
      return res.status(413).json({ message: 'File too large (max 10 MB).' });
    }

    const result = await cloudinaryService.uploadBuffer(req.file.buffer, {
      folder: `taskara/task-${taskId}`,
      filename: req.file.originalname,
    });

    const saved = await attachmentModel.create({
      taskId,
      uploadedBy: req.user.id,
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      fileSize: result.bytes ?? req.file.size,
      mimeType: req.file.mimetype || null,
      publicId: result.public_id,
      resourceType: result.resource_type || 'image',
    });

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id/attachments
async function listAttachments(req, res, next) {
  try {
    const taskId = parseId(req.params.id);
    if (taskId === null) return res.status(400).json({ message: 'Invalid task id' });
    if (!(await taskModel.hasAccess(taskId, req.user.id))) {
      return res.status(403).json({ message: 'No access to this task.' });
    }
    const rows = await attachmentModel.findByTask(taskId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id/attachments/:attachmentId
async function deleteAttachment(req, res, next) {
  try {
    const taskId = parseId(req.params.id);
    const attachmentId = parseId(req.params.attachmentId);
    if (taskId === null || attachmentId === null) {
      return res.status(400).json({ message: 'Invalid task or attachment id' });
    }

    const att = await attachmentModel.findById(attachmentId);
    if (!att || att.task_id !== taskId) {
      return res.status(404).json({ message: 'Attachment not found.' });
    }

    const isUploader = att.uploaded_by === req.user.id;
    const isOwner = await taskModel.isOwner(taskId, req.user.id);
    if (!isUploader && !isOwner) {
      return res.status(403).json({ message: 'Only the uploader or task owner can delete this.' });
    }

    if (att.public_id) {
      try {
        await cloudinaryService.destroy(att.public_id, att.resource_type || 'image');
      } catch (cloudErr) {
        // Don't orphan the DB row by silently dropping the file in storage.
        // Surface the failure so the client can retry — the operation is idempotent
        // (the attachment row stays until storage actually clears).
        console.error('[attachment] cloudinary destroy failed', cloudErr.message);
        return res.status(502).json({ message: 'Could not remove file from storage; please try again.' });
      }
    }

    await attachmentModel.remove(attachmentId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadAttachment, listAttachments, deleteAttachment };
