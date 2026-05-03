const express = require('express');
const multer = require('multer');
const router = express.Router();
const taskController = require('../controllers/taskController');
const taskShareController = require('../controllers/taskShareController');
const timeEntryController = require('../controllers/timeEntryController');
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

// In-memory upload — small files (<=10 MB) are streamed to Cloudinary
// before any disk I/O.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/', authenticate, taskController.getAllTasks);
router.get('/search', authenticate, taskController.searchTasks);
router.get('/:id', authenticate, taskController.getTaskById);
router.post('/', authenticate, taskController.createTask);
router.put('/:id', authenticate, taskController.updateTask);
router.delete('/:id', authenticate, taskController.deleteTask);

// Comments
router.get('/:id/comments', authenticate, taskController.getComments);
router.post('/:id/comments', authenticate, taskController.addComment);
router.delete('/:id/comments/:commentId', authenticate, taskController.deleteComment);

// Sharing
router.get('/:id/shares', authenticate, taskShareController.getSharedUsers);
router.post('/:id/share', authenticate, taskShareController.shareTask);
router.delete('/:id/share/:userId', authenticate, taskShareController.unshareTask);

// Time tracking
router.get('/:id/time', authenticate, timeEntryController.listEntries);
router.post('/:id/time/start', authenticate, timeEntryController.startTimer);
router.post('/:id/time/stop', authenticate, timeEntryController.stopTimer);
router.post('/:id/time/manual', authenticate, timeEntryController.addManual);

// Attachments
router.get('/:id/attachments', authenticate, attachmentController.listAttachments);
router.post(
  '/:id/attachments',
  authenticate,
  uploadLimiter,
  upload.single('file'),
  attachmentController.uploadAttachment
);
router.delete(
  '/:id/attachments/:attachmentId',
  authenticate,
  attachmentController.deleteAttachment
);

module.exports = router;
