const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const taskShareController = require('../controllers/taskShareController');
const { authenticate } = require('../middleware/authMiddleware');

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

// Attachments
router.post('/:id/attachments', authenticate, taskController.addAttachment);

module.exports = router;
