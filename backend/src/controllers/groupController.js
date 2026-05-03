const groupModel = require('../models/groupModel');
const groupMemberModel = require('../models/groupMemberModel');
const taskModel = require('../models/taskModel');
const conversationModel = require('../models/conversationModel');
const parseId = require('../utils/parseId');

function validateCreate(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required');
  } else if (body.name.length > 120) {
    errors.push('name must be 120 chars or less');
  }
  if (!body.slug || !groupModel.isValidSlug(body.slug)) {
    errors.push('slug must be 3–60 chars, lowercase letters, numbers, and hyphens (no leading/trailing hyphen)');
  }
  if (body.description && typeof body.description === 'string' && body.description.length > 2000) {
    errors.push('description must be 2000 chars or less');
  }
  return errors;
}

async function createGroup(req, res, next) {
  try {
    const errors = validateCreate(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const slug = req.body.slug.toLowerCase();
    const existing = await groupModel.findBySlug(slug);
    if (existing) {
      return res.status(409).json({ message: 'Slug already taken' });
    }

    const group = await groupModel.create({
      name: req.body.name.trim(),
      slug,
      description: req.body.description?.trim() || null,
      ownerId: req.user.id,
    });
    // Creator joins as owner.
    await groupMemberModel.add({ groupId: group.id, userId: req.user.id, role: 'owner' });
    // Auto-create the group's chat room. Failure here shouldn't block group
    // creation — `getGroupConversation` will create-on-demand later if needed.
    try { await conversationModel.createForGroup(group.id); }
    catch (err) { console.warn('[groups] convo create failed:', err.message); }
    res.status(201).json(group);
  } catch (err) { next(err); }
}

// All groups the user is a member of.
async function listMyGroups(req, res, next) {
  try {
    const groups = await groupModel.findAllForUser(req.user.id);
    res.json(groups);
  } catch (err) { next(err); }
}

async function searchGroups(req, res, next) {
  try {
    const q = req.query.q;
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10), 50) : 12;
    const groups = await groupModel.search({ q, limit, userId: req.user.id });
    res.json(groups);
  } catch (err) { next(err); }
}

// Full group payload: group + members + role of caller.
async function getGroup(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'Invalid id' });
    const group = await groupModel.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const role = await groupMemberModel.findUserRole(id, req.user.id);
    if (!role) return res.status(403).json({ message: 'Not a member of this group' });
    const members = await groupMemberModel.findByGroup(id);
    res.json({ ...group, role, members });
  } catch (err) { next(err); }
}

async function updateGroup(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'Invalid id' });
    const group = await groupModel.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const role = await groupMemberModel.findUserRole(id, req.user.id);
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ message: 'Owners and admins only' });
    }

    const fields = {};
    if (req.body.name !== undefined) {
      if (!req.body.name.trim() || req.body.name.length > 120) {
        return res.status(400).json({ errors: ['name must be 1–120 chars'] });
      }
      fields.name = req.body.name.trim();
    }
    if (req.body.description !== undefined) {
      fields.description = req.body.description?.trim() || null;
    }
    if (req.body.slug !== undefined) {
      if (!groupModel.isValidSlug(req.body.slug)) {
        return res.status(400).json({ errors: ['slug invalid'] });
      }
      const slug = req.body.slug.toLowerCase();
      const taken = await groupModel.findBySlug(slug);
      if (taken && taken.id !== id) {
        return res.status(409).json({ message: 'Slug already taken' });
      }
      fields.slug = slug;
    }

    const updated = await groupModel.update(id, fields);
    res.json(updated);
  } catch (err) { next(err); }
}

async function deleteGroup(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'Invalid id' });
    const group = await groupModel.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete' });
    }
    await groupModel.remove(id);
    res.status(204).send();
  } catch (err) { next(err); }
}

// Open self-join via slug. Anyone authenticated can join any group they
// can find — discovery is by slug, so that's the gate.
async function joinGroup(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'Invalid id' });
    const group = await groupModel.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const member = await groupMemberModel.add({
      groupId: id, userId: req.user.id, role: 'member',
    });
    res.status(member ? 201 : 200).json({ joined: !!member, group_id: id });
  } catch (err) { next(err); }
}

// Leaving — distinct from being kicked. Owners can't leave (they must
// transfer ownership or delete the group); we keep it simple: owners must
// delete to "leave".
async function leaveGroup(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'Invalid id' });
    const group = await groupModel.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.owner_id === req.user.id) {
      return res.status(400).json({ message: 'Owner must delete the group instead of leaving' });
    }
    await groupMemberModel.remove(id, req.user.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

// Admin/owner removes another member.
async function removeMember(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const targetUserId = parseId(req.params.userId);
    if (id === null || targetUserId === null) return res.status(400).json({ message: 'Invalid id' });
    const group = await groupModel.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const callerRole = await groupMemberModel.findUserRole(id, req.user.id);
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return res.status(403).json({ message: 'Owners and admins only' });
    }
    if (group.owner_id === targetUserId) {
      return res.status(400).json({ message: "Can't remove the owner" });
    }
    // Admins can't remove other admins; only the owner can.
    const targetRole = await groupMemberModel.findUserRole(id, targetUserId);
    if (callerRole === 'admin' && targetRole === 'admin') {
      return res.status(403).json({ message: "Admins can't remove other admins" });
    }
    await groupMemberModel.remove(id, targetUserId);
    res.status(204).send();
  } catch (err) { next(err); }
}

// Owner-only role changes (admin <-> member). Ownership transfer is not
// supported in this MVP — owner must delete the group.
async function changeRole(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const targetUserId = parseId(req.params.userId);
    if (id === null || targetUserId === null) return res.status(400).json({ message: 'Invalid id' });
    const group = await groupModel.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can change roles' });
    }
    const role = req.body.role;
    if (role !== 'admin' && role !== 'member') {
      return res.status(400).json({ message: 'role must be admin or member' });
    }
    if (group.owner_id === targetUserId) {
      return res.status(400).json({ message: "Can't change the owner's role" });
    }
    const updated = await groupMemberModel.updateRole(id, targetUserId, role);
    if (!updated) return res.status(404).json({ message: 'Member not found' });
    res.json(updated);
  } catch (err) { next(err); }
}

// Tasks belonging to this group, with the existing rich shape (categories,
// shares, etc.). Members see all tasks; non-members 403.
async function listGroupTasks(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'Invalid id' });
    const role = await groupMemberModel.findUserRole(id, req.user.id);
    if (!role) return res.status(403).json({ message: 'Not a member of this group' });
    const tasks = await taskModel.findAllByGroup(id);
    res.json(tasks);
  } catch (err) { next(err); }
}

module.exports = {
  createGroup, listMyGroups, searchGroups, getGroup, updateGroup, deleteGroup,
  joinGroup, leaveGroup, removeMember, changeRole, listGroupTasks,
};
