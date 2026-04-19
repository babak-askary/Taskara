const categoryModel = require('../models/categoryModel');
const { validateCategoryInput } = require('../utils/validateTask');

// POST /api/categories — create a new category for the user
async function createCategory(req, res, next) {
  try {
    const { valid, errors } = validateCategoryInput(req.body);
    if (!valid) return res.status(400).json({ errors });

    const category = await categoryModel.create({
      name: req.body.name.trim(),
      color: req.body.color,
      userId: req.user.id,
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

// GET /api/categories — list the user's categories
async function getCategories(req, res, next) {
  try {
    const categories = await categoryModel.findAllByUser(req.user.id);
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

// PUT /api/categories/:id — update a category (must belong to user)
async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await categoryModel.findById(id);

    if (!existing) return res.status(404).json({ message: 'Category not found' });
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ message: 'This category does not belong to you' });
    }

    const { valid, errors } = validateCategoryInput(req.body, { partial: true });
    if (!valid) return res.status(400).json({ errors });

    const updated = await categoryModel.update(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categories/:id — delete a category (tasks become uncategorized)
async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await categoryModel.findById(id);

    if (!existing) return res.status(404).json({ message: 'Category not found' });
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ message: 'This category does not belong to you' });
    }

    await categoryModel.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
