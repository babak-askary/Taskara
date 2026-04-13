// Each function handles one task action

async function getAllTasks(req, res, next) {
  try {
    // TODO: Fetch all tasks with filters
    res.status(501).json({ message: 'Get all tasks not yet implemented' });
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    // TODO: Fetch single task by ID
    res.status(501).json({ message: 'Get task not yet implemented' });
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    // TODO: Create a new task
    res.status(501).json({ message: 'Create task not yet implemented' });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    // TODO: Update an existing task
    res.status(501).json({ message: 'Update task not yet implemented' });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    // TODO: Delete a task
    res.status(501).json({ message: 'Delete task not yet implemented' });
  } catch (err) {
    next(err);
  }
}

async function searchTasks(req, res, next) {
  try {
    // TODO: Search tasks by query
    res.status(501).json({ message: 'Search tasks not yet implemented' });
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    // TODO: Add comment to a task
    res.status(501).json({ message: 'Add comment not yet implemented' });
  } catch (err) {
    next(err);
  }
}

async function addAttachment(req, res, next) {
  try {
    // TODO: Add file attachment to a task
    res.status(501).json({ message: 'Add attachment not yet implemented' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  searchTasks,
  addComment,
  addAttachment,
};
