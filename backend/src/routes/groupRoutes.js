const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/',                       groupController.createGroup);
router.get('/',                        groupController.listMyGroups);
router.get('/search',                  groupController.searchGroups);
router.get('/:id',                     groupController.getGroup);
router.put('/:id',                     groupController.updateGroup);
router.delete('/:id',                  groupController.deleteGroup);
router.post('/:id/join',               groupController.joinGroup);
router.post('/:id/leave',              groupController.leaveGroup);
router.delete('/:id/members/:userId',  groupController.removeMember);
router.put('/:id/members/:userId',     groupController.changeRole);
router.get('/:id/tasks',               groupController.listGroupTasks);

module.exports = router;
