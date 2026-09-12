'use strict';

const mongoose = require('mongoose');
const Couple = require('../models/Couple');
const User   = require('../models/User');
const { createError } = require('../middleware/errorHandler');

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

async function getMyCouple(req, res, next) {
  try {
    if (!req.user.coupleId) {
      return res.json({ success: true, data: { couple: null, isPaired: false } });
    }

    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const couple = await Couple.findById(coupleId).populate('members', POPULATE_MEMBERS).lean();
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

async function joinCouple(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { inviteCode } = req.body;

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

    if (couple.members.some((m) => m._id.toString() === req.user._id.toString())) {
      await session.abortTransaction();
      return next(createError('You are already a member of this couple.', 409, 'ALREADY_PAIRED'));
    }

    couple.members.push(req.user._id);
    await couple.save({ session });

    await User.findByIdAndUpdate(
      req.user._id,
      { coupleId: couple._id },
      { session }
    );

    await session.commitTransaction();

    const updatedCouple = await Couple.findById(couple._id).populate('members', POPULATE_MEMBERS);

    const partnerId = updatedCouple.members.find(m => m._id.toString() !== req.user._id.toString())?._id;
    if (partnerId) {
      try {
        const { getIo } = require('../config/socket');
        getIo().to(`user_${partnerId.toString()}`).emit('partner_joined');
      } catch (notifyErr) {
        console.error('[Socket Error] Failed to notify partner:', notifyErr.message);
      }
    }

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

async function updateCouple(req, res, next) {
  try {
    if (!req.user.coupleId) {
      return next(createError('You are not in a couple.', 403, 'NOT_PAIRED'));
    }

    const allowed = ['coupleNickname', 'anniversaryDate', 'relationshipStatus', 'coupleBio', 'milestones', 'bucketList', 'dateIdeas'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

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
