'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Couple = require('../models/Couple');
const generateInviteCode = require('../utils/generateInviteCode');
const { setAuthCookies, clearAuthCookies } = require('../utils/tokens');
const { createError } = require('../middleware/errorHandler');
const imagekitService = require('../services/imagekit');
const { createAvatarUpload } = require('../config/multer');

// ─── Multer for avatar uploads (memory storage → ImageKit) ───────────────────────
const avatarUpload = createAvatarUpload();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safe public user representation.
 * Never returns passwordHash, avatarFileId, or other internal fields.
 */
function formatUser(user, couple) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    nickname: user.nickname || '',
    gender: user.gender || null,
    dateOfBirth: user.dateOfBirth || null,
    bio: user.bio || '',
    favouriteColour: user.favouriteColour || '',
    partnerKnowledge: user.partnerKnowledge || [],
    avatarUrl: user.avatarUrl || null,
    currentStatus:      user.currentStatus || 'happy',
    hugsSent: user.hugsSent || 0,
    role: user.role,
    onboardingComplete: user.onboardingComplete,
    coupleId: user.coupleId,
    isPaired: !!(couple && couple.members.length === 2),
    couple: couple
      ? {
          id: couple._id,
          inviteCode: couple.inviteCode,
          coupleNickname: couple.coupleNickname || '',
          relationshipStatus: couple.relationshipStatus || '',
          coupleBio: couple.coupleBio || '',
          anniversaryDate:    couple.anniversaryDate,
          milestones:         couple.milestones || [],
          bucketList:         couple.bucketList || [],
          interactions:       couple.interactions || { hugCount: 0, kissCount: 0 },
          themeSong:          couple.themeSong || null,
          memberCount:        couple.members.length,
        }
      : null,
  };
}

async function generateUniqueInviteCode(session) {
  let inviteCode;
  let attempts = 0;
  while (!inviteCode && attempts < 10) {
    const candidate = generateInviteCode();
    const exists = await Couple.findOne({ inviteCode: candidate }).session(session);
    if (!exists) inviteCode = candidate;
    attempts++;
  }
  if (!inviteCode) throw new Error('Could not generate a unique invite code. Please try again.');
  return inviteCode;
}

// ─── Signup ───────────────────────────────────────────────────────────────────
/**
 * Creates user and assigns to a couple.
 *
 * Body:
 *   name, email, password
 *   inviteCode? (optional, to join an existing couple)
 */
async function signup(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, email, password, inviteCode } = req.body;

    // ── Duplicate email checks ────────────────────────────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() }).session(session);

    if (existingUser) {
      await session.abortTransaction();
      return next(createError('An account with this email already exists.', 409, 'EMAIL_ALREADY_EXISTS'));
    }

    // ── Hash password ───────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    let couple;
    let role;

    if (inviteCode) {
      // Joining an existing couple
      couple = await Couple.findOne({ inviteCode: inviteCode.toUpperCase().trim() }).session(session);
      
      if (!couple) {
        await session.abortTransaction();
        return next(createError('Invalid invite code. Please check and try again.', 404, 'INVALID_INVITE_CODE'));
      }
      if (couple.members.length >= 2) {
        await session.abortTransaction();
        return next(createError('This couple is already full.', 409, 'COUPLE_FULL'));
      }
      role = 'partner';
    } else {
      // Creating a new couple
      const newInviteCode = await generateUniqueInviteCode(session);
      couple = new Couple({ members: [], inviteCode: newInviteCode });
      await couple.save({ session });
      role = 'admin';
    }

    // ── Create user ─────────────────────────────────────────────────────
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: passwordHash,
      coupleId: couple._id,
      role: role,
    });
    await user.save({ session });

    // ── Link user to couple ───────────────────────────────────────────────────
    couple.members.push(user._id);
    await couple.save({ session });

    await session.commitTransaction();

    // ── Issue cookie-based session ────────────────────────────
    setAuthCookies(res, user._id);

    return res.status(201).json({
      success: true,
      data: { user: formatUser(user, couple) },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .populate('coupleId');

    if (!user) {
      return next(createError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return next(createError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    setAuthCookies(res, user._id);

    return res.json({
      success: true,
      data: { user: formatUser(user, user.coupleId) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────
/**
 * Explicit refresh endpoint (called when silent rotation in middleware fails).
 * Reads the refreshToken cookie and rotates both cookies.
 */
async function refresh(req, res, next) {
  try {
    // Note: authenticate middleware handles silent rotation automatically.
    // This endpoint is kept for cases where the client explicitly needs to refresh.
    const { verifyRefreshToken } = require('../utils/tokens');
    const token = req.cookies?.refreshToken;
    if (!token) return next(createError('No refresh token', 401, 'UNAUTHORIZED'));

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).populate('coupleId');
    if (!user) return next(createError('User not found', 401, 'UNAUTHORIZED'));

    setAuthCookies(res, user._id);

    return res.json({ success: true, data: { message: 'Session refreshed' } });
  } catch (_) {
    return next(createError('Invalid or expired refresh token. Please log in again.', 401, 'UNAUTHORIZED'));
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function logout(req, res) {
  clearAuthCookies(res);
  return res.json({ success: true, data: { message: 'Logged out successfully.' } });
}

// ─── Me ───────────────────────────────────────────────────────────────────────
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate('coupleId');
    if (!user) return next(createError('User not found', 404, 'NOT_FOUND'));

    return res.json({
      success: true,
      data: { user: formatUser(user, user.coupleId) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Update Me ────────────────────────────────────────────────────────────────
async function updateMe(req, res, next) {
  try {
    const allowed = ['name', 'nickname', 'gender', 'dateOfBirth', 'bio', 'favouriteColour', 'partnerKnowledge', 'currentStatus', 'hugsSent'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.name !== undefined) {
      updates.name = updates.name.trim();
      if (!updates.name) return next(createError('Name cannot be empty', 400, 'VALIDATION_ERROR'));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('coupleId');

    return res.json({ success: true, data: { user: formatUser(user, user.coupleId) } });
  } catch (err) {
    next(err);
  }
}

// ─── Update Partner ───────────────────────────────────────────────────────────
async function updatePartner(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      return next(createError('Only admins can update partner profiles.', 403, 'FORBIDDEN'));
    }

    const partner = await User.findOne({ coupleId: req.user.coupleId, _id: { $ne: req.user._id } });
    if (!partner) return next(createError('Partner not found.', 404, 'NOT_FOUND'));

    const updates = {};
    if (req.body.nickname !== undefined) updates.nickname = req.body.nickname.trim();

    await User.findByIdAndUpdate(
      partner._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Return the current user so UI can update the whole state which populates partner inside Couple
    const user = await User.findById(req.user._id).populate({
      path: 'coupleId',
      populate: { path: 'members' }
    });

    return res.json({ success: true, data: { user: formatUser(user, user.coupleId) } });
  } catch (err) {
    next(err);
  }
}

// ─── Change Password ──────────────────────────────────────────────────────────
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) return next(createError('User not found', 404, 'NOT_FOUND'));

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return next(createError('Current password is incorrect.', 400, 'INVALID_CREDENTIALS'));

    if (newPassword.length < 8) {
      return next(createError('New password must be at least 8 characters.', 400, 'VALIDATION_ERROR'));
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Rotate session cookies so any leaked old tokens are invalidated
    setAuthCookies(res, user._id);

    return res.json({ success: true, data: { message: 'Password updated successfully.' } });
  } catch (err) {
    next(err);
  }
}

// ─── Complete Onboarding ──────────────────────────────────────────────────────
async function completeOnboarding(req, res, next) {
  try {
    const { nickname, gender, dateOfBirth, bio, favouriteColour } = req.body;

    const updates = { onboardingComplete: true };
    if (nickname !== undefined) updates.nickname = nickname.trim();
    if (gender !== undefined) updates.gender = gender;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth || null;
    if (bio !== undefined) updates.bio = bio.trim();
    if (favouriteColour !== undefined) updates.favouriteColour = favouriteColour.trim();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('coupleId');

    return res.json({ success: true, data: { user: formatUser(user, user.coupleId) } });
  } catch (err) {
    next(err);
  }
}

// ─── Upload Avatar ────────────────────────────────────────────────────────────
async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return next(createError('No image provided.', 400, 'NO_FILE'));

    const coupleId = req.user.coupleId?._id || req.user.coupleId;
    const folder = `tether/${coupleId}/avatars`;
    const ext = path.extname(req.file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';
    const fileName = `${uuidv4()}${ext}`;

    const { url, fileId } = await imagekitService.uploadFile({
      buffer: req.file.buffer,
      fileName,
      folder,
      tags: ['avatar', String(req.user._id)],
    });

    // Delete old avatar from ImageKit if it exists
    const existing = await User.findById(req.user._id).select('+avatarFileId');
    if (existing?.avatarFileId) {
      await imagekitService.deleteFile(existing.avatarFileId);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: url, avatarFileId: fileId },
      { new: true }
    ).populate('coupleId');

    return res.json({ success: true, data: { user: formatUser(user, user.coupleId) } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  me,
  updateMe,
  updatePartner,
  changePassword,
  completeOnboarding,
  uploadAvatar,
  avatarUpload,
};
