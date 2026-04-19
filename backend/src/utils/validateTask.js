const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Validate task input. Returns { valid: true } or { valid: false, errors: [...] }.
function validateTaskInput(body, { partial = false } = {}) {
  const errors = [];

  // Title is required on create, optional on update
  if (!partial || body.title !== undefined) {
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      errors.push('title is required and must be a non-empty string');
    } else if (body.title.length > 255) {
      errors.push('title must be 255 characters or less');
    }
  }

  // Status must be one of the allowed values
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Priority must be one of the allowed values
  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  // Due date must be a valid date if provided
  if (body.due_date !== undefined && body.due_date !== null) {
    const d = new Date(body.due_date);
    if (isNaN(d.getTime())) {
      errors.push('due_date must be a valid ISO date string');
    }
  }

  // Time values must be positive integers
  if (body.time_spent !== undefined && (!Number.isInteger(body.time_spent) || body.time_spent < 0)) {
    errors.push('time_spent must be a non-negative integer (minutes)');
  }
  if (body.estimated_time !== undefined && body.estimated_time !== null && (!Number.isInteger(body.estimated_time) || body.estimated_time < 0)) {
    errors.push('estimated_time must be a non-negative integer (minutes)');
  }

  return { valid: errors.length === 0, errors };
}

// Validate category input
function validateCategoryInput(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.name !== undefined) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('name is required and must be a non-empty string');
    } else if (body.name.length > 100) {
      errors.push('name must be 100 characters or less');
    }
  }

  if (body.color !== undefined) {
    if (typeof body.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(body.color)) {
      errors.push('color must be a hex color like #6366f1');
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateTaskInput, validateCategoryInput };
