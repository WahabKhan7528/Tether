'use strict';

const mongoose = require('mongoose');
const Couple = require('../models/Couple');
const User   = require('../models/User');
const { createError } = require('../middleware/errorHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a safe partner object (excludes internal fields like passwordHash).
 */
function formatPartner(member, currentUserId) {
  if (!member || member._id.toString() === currentUserId.toString()) return null;
  return {
    id:                 member._id,
    name:               member.name,
    email:              member.email,
    nickname:           member.nickname || '',
    gender:             member.gender || null,
    bio:                member.bio || '',
    favouriteColour:    member.favouriteColour || '',
    avatarUrl:          member.avatarUrl || null,
    currentStatus:      member.currentStatus || 'happy',
    hugsSent:           member.hugsSent || 0,
    role:               member.role,
    onboardingComplete: member.onboardingComplete,
  };
}

/**
 * Build the shared couple payload used by multiple handlers.
 */
function formatCouple(couple, currentUserId) {
  const partner = couple.members.find((m) => m._id.toString() !== currentUserId.toString());
  return {
    id:                 couple._id,
    inviteCode:         couple.inviteCode,
    coupleNickname:     couple.coupleNickname || '',
    relationshipStatus: couple.relationshipStatus || '',
    coupleBio:          couple.coupleBio || '',
    anniversaryDate:    couple.anniversaryDate,
    milestones:         couple.milestones || [],
    bucketList:         couple.bucketList || [],
    dateIdeas:          couple.dateIdeas || [],
    interactions:       couple.interactions || { hugCount: 0, kissCount: 0 },
    memberCount:        couple.members.length,
    partner:            partner ? formatPartner(partner, currentUserId) : null,
  };
}

const POPULATE_MEMBERS = 'name email nickname gender bio favouriteColour avatarUrl currentStatus hugsSent role onboardingComplete';

// ─── Get My Couple ─────────────────────────────────────────────────────────────
async function getMyCouple(req, res, next) {
  try {
    if (!req.user.coupleId) {
      return res.json({ success: true, data: { couple: null, isPaired: false } });
    }

    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findById(coupleId).populate('members', POPULATE_MEMBERS);
    if (!couple) return next(createError('Couple not found', 404, 'NOT_FOUND'));

    return res.json({
      success: true,
      data: {
        couple:   formatCouple(couple, req.user._id),
        isPaired: couple.members.length === 2,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Join Couple (via invite code) ────────────────────────────────────────────
/**
 * Allows an authenticated user who has no coupleId to join an existing couple
 * by supplying the couple's inviteCode. The couple must have exactly 1 member.
 *
 * This is how the second user logs into the shared space for the first time
 * if an alternative signup flow (e.g. invite link) is used.
 */
async function joinCouple(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { inviteCode } = req.body;

    // User must not already belong to a couple
    if (req.user.coupleId) {
      await session.abortTransaction();
      return next(createError('You are already paired with a partner.', 409, 'ALREADY_PAIRED'));
    }

    const couple = await Couple.findOne({ inviteCode: inviteCode.toUpperCase().trim() })
      .session(session)
      .populate('members', POPULATE_MEMBERS);

    if (!couple) {
      await session.abortTransaction();
      return next(createError('Invalid invite code. Please check and try again.', 404, 'INVALID_INVITE_CODE'));
    }

    if (couple.members.length >= 2) {
      await session.abortTransaction();
      return next(createError('This couple is already full. Each couple can have at most 2 members.', 409, 'COUPLE_FULL'));
    }

    // Check the requesting user is not the same as the existing member
    if (couple.members.some((m) => m._id.toString() === req.user._id.toString())) {
      await session.abortTransaction();
      return next(createError('You are already a member of this couple.', 409, 'ALREADY_PAIRED'));
    }

    // Add user to couple
    couple.members.push(req.user._id);
    await couple.save({ session });

    // Link couple to user
    await User.findByIdAndUpdate(
      req.user._id,
      { coupleId: couple._id },
      { session }
    );

    await session.commitTransaction();

    // Re-fetch with full populate for consistent response shape
    const updatedCouple = await Couple.findById(couple._id).populate('members', POPULATE_MEMBERS);

    return res.json({
      success: true,
      data: {
        couple:   formatCouple(updatedCouple, req.user._id),
        isPaired: updatedCouple.members.length === 2,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}

// ─── Update Couple ─────────────────────────────────────────────────────────────
async function updateCouple(req, res, next) {
  try {
    if (!req.user.coupleId) {
      return next(createError('You are not in a couple.', 403, 'NOT_PAIRED'));
    }

    // Only safe scalar fields and full array replacements
    const allowed = ['coupleNickname', 'anniversaryDate', 'relationshipStatus', 'coupleBio', 'milestones', 'bucketList', 'dateIdeas'];
    const updates = {};
    console.log('Update couple called with req.body:', req.body);
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    console.log('Updates to apply:', updates);

    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findByIdAndUpdate(
      coupleId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('members', POPULATE_MEMBERS);

    if (!couple) return next(createError('Couple not found', 404, 'NOT_FOUND'));

    return res.json({
      success: true,
      data: { couple: formatCouple(couple, req.user._id) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Milestones ───────────────────────────────────────────────────────────────

async function addMilestone(req, res, next) {
  try {
    const { title, date, description } = req.body;

    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findByIdAndUpdate(
      coupleId,
      {
        $push: {
          milestones: {
            title:       title.trim(),
            date:        new Date(date),
            description: description?.trim() || '',
          },
        },
      },
      { new: true, runValidators: true }
    ).populate('members', POPULATE_MEMBERS);

    if (!couple) return next(createError('Couple not found', 404, 'NOT_FOUND'));

    return res.status(201).json({
      success: true,
      data: { couple: formatCouple(couple, req.user._id) },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteMilestone(req, res, next) {
  try {
    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findByIdAndUpdate(
      coupleId,
      { $pull: { milestones: { _id: req.params.itemId } } },
      { new: true }
    ).populate('members', POPULATE_MEMBERS);

    if (!couple) return next(createError('Couple not found', 404, 'NOT_FOUND'));

    return res.json({
      success: true,
      data: { couple: formatCouple(couple, req.user._id) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Bucket List ──────────────────────────────────────────────────────────────

async function addBucketListItem(req, res, next) {
  try {
    const { title } = req.body;

    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findByIdAndUpdate(
      coupleId,
      {
        $push: {
          bucketList: {
            title:    title.trim(),
            addedBy:  req.user._id,
            isCompleted: false,
          },
        },
      },
      { new: true, runValidators: true }
    ).populate('members', POPULATE_MEMBERS);

    if (!couple) return next(createError('Couple not found', 404, 'NOT_FOUND'));

    return res.status(201).json({
      success: true,
      data: { couple: formatCouple(couple, req.user._id) },
    });
  } catch (err) {
    next(err);
  }
}

async function toggleBucketListItem(req, res, next) {
  try {
    // First, find current state to toggle it
    const current = await Couple.findOne(
      { _id: req.user.coupleId, 'bucketList._id': req.params.itemId },
      { 'bucketList.$': 1 }
    );

    if (!current || !current.bucketList[0]) {
      return next(createError('Bucket list item not found', 404, 'NOT_FOUND'));
    }

    const newState = !current.bucketList[0].isCompleted;

    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findOneAndUpdate(
      { _id: coupleId, 'bucketList._id': req.params.itemId },
      { $set: { 'bucketList.$.isCompleted': newState } },
      { new: true }
    ).populate('members', POPULATE_MEMBERS);

    if (!couple) return next(createError('Couple not found', 404, 'NOT_FOUND'));

    return res.json({
      success: true,
      data: { couple: formatCouple(couple, req.user._id) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Delete Bucket List Item ──────────────────────────────────────────────────
async function deleteBucketListItem(req, res, next) {
  try {
    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findByIdAndUpdate(
      coupleId,
      { $pull: { bucketList: { _id: req.params.itemId } } },
      { new: true }
    ).populate('members', POPULATE_MEMBERS);

    if (!couple) return next(createError('Couple not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: { couple: formatCouple(couple, req.user._id) } });
  } catch (err) {
    next(err);
  }
}

// ─── Date Ideas (Ideas Jar) ───────────────────────────────────────────────────

async function addDateIdea(req, res, next) {
  try {
    const { title, description } = req.body;
    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findByIdAndUpdate(
      coupleId,
      {
        $push: {
          dateIdeas: {
            title: title.trim(),
            description: description?.trim() || '',
            addedBy: req.user._id,
          },
        },
      },
      { new: true, runValidators: true }
    ).populate('members', POPULATE_MEMBERS);

    if (!couple) return next(createError('Couple not found', 404, 'NOT_FOUND'));

    return res.status(201).json({ success: true, data: { couple: formatCouple(couple, req.user._id) } });
  } catch (err) {
    next(err);
  }
}

async function deleteDateIdea(req, res, next) {
  try {
    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findByIdAndUpdate(
      coupleId,
      { $pull: { dateIdeas: { _id: req.params.itemId } } },
      { new: true }
    ).populate('members', POPULATE_MEMBERS);

    if (!couple) return next(createError('Couple not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: { couple: formatCouple(couple, req.user._id) } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyCouple,
  updateCouple,
  joinCouple,
  addMilestone,
  deleteMilestone,
  addBucketListItem,
  toggleBucketListItem,
  deleteBucketListItem,
  addDateIdea,
  deleteDateIdea,
};
