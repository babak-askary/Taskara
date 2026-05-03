const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/conversations',                chatController.listConversations);
router.post('/conversations/direct',        chatController.startDirect);
router.get('/conversations/group/:groupId', chatController.getGroupConversation);
router.get('/conversations/:id',            chatController.getConversation);
router.get('/conversations/:id/messages',   chatController.listMessages);
router.post('/conversations/:id/messages',  chatController.sendMessage);

module.exports = router;
