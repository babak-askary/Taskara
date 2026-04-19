const categoryModel = require('../models/categoryModel');

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function validateCategory(body, partial = false) {
  const errors = [];
  if (!partial || body.name !== undefined) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('name is required');
    } else if (body.name.length > 100) {
      errors.push('name must be 100 chars or less');
    }
  }
  if (body.color !== undefined && !HEX_COLOR.test(body.color)) {
    errors.push('color must be a hex like #6366f1');
  }
  return errors;
}

async function createCategory(req, res, next) {
  try {
    const errors = validateCategory(req.body);
    if (errors.length) return res.status(400).json({ errors });

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

async function getCategories(req, res, next) {
  try {
    const categories = await categoryModel.findAllByUser(req.user.id);
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await categoryModel.findById(id);
    if (!existing) return res.status(404).json({ message: 'Category not found' });
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not your category' });
    }

    const errors = validateCategory(req.body, true);
    if (errors.length) return res.status(400).json({ errors });

    const updated = await categoryModel.update(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await categoryModel.findById(id);
    if (!existing) return res.status(404).json({ message: 'Category not found' });
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not your category' });
    }
    await categoryModel.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
