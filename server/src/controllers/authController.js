'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Couple = require('../models/Couple');
const generateInviteCode = require('../utils/generateInviteCode');
const { setAuthCookies, clearAuthCookies, ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } = require('../utils/tokens');
const { createError } = require('../middleware/errorHandler');
const { createAvatarUpload } = require('../config/multer');
const signMediaUrl = require('../utils/signMediaUrl');

const avatarUpload = createAvatarUpload();

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
    avatarUrl: signMediaUrl(user.avatarUrl) || null,
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

async function signup(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, email, password, inviteCode } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() }).session(session);

    if (existingUser) {
      await session.abortTransaction();
      return next(createError('An account with this email already exists.', 409, 'EMAIL_ALREADY_EXISTS'));
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let couple;
    let role;

    if (inviteCode) {

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

      const newInviteCode = await generateUniqueInviteCode(session);
      couple = new Couple({ members: [], inviteCode: newInviteCode });
      await couple.save({ session });
      role = 'admin';
    }

    const tokenFamily = uuidv4();

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: passwordHash,
      coupleId: couple._id,
      role: role,
      tokenFamily: tokenFamily,
      tokenFamilyIssuedAt: new Date(),
    });
    await user.save({ session });

    couple.members.push(user._id);
    await couple.save({ session });

    await session.commitTransaction();

    setAuthCookies(res, user._id, tokenFamily);

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

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash +loginFailures +lockUntil +tokenFamily')
      .populate('coupleId');

    if (!user) {
      console.warn(`[Security - Audit] Failed login attempt for unknown email: ${email}`);
      return next(createError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      console.warn(`[Security - Audit] Attempt to log into locked account: ${user._id}`);
      return next(createError('Account locked due to too many failed attempts. Try again later.', 403, 'ACCOUNT_LOCKED'));
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      user.loginFailures = (user.loginFailures || 0) + 1;
      if (user.loginFailures >= 5) {
        const lockTimeMs = user.loginFailures > 10 ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
        user.lockUntil = new Date(Date.now() + lockTimeMs);
        console.warn(`[Security - Audit] Account locked for user: ${user._id} due to ${user.loginFailures} failed attempts.`);
      } else {
        console.warn(`[Security - Audit] Failed login attempt ${user.loginFailures} for user: ${user._id}`);
      }
      await user.save();
      return next(createError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    if (user.loginFailures > 0) {
      user.loginFailures = 0;
      user.lockUntil = null;
    }

    user.tokenFamily = uuidv4();
    user.tokenFamilyIssuedAt = new Date();
    await user.save();

    setAuthCookies(res, user._id, user.tokenFamily);

    return res.json({
      success: true,
      data: { user: formatUser(user, user.coupleId) },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {

    const { verifyRefreshToken } = require('../utils/tokens');
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) return next(createError('No refresh token', 401, 'UNAUTHORIZED'));

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select('+tokenFamily').populate('coupleId');
    if (!user) return next(createError('User not found', 401, 'UNAUTHORIZED'));

    // Token reuse detection (stolen refresh token)
    if (decoded.family && user.tokenFamily && decoded.family !== user.tokenFamily) {
      // Hijack detected! Clear family to revoke ALL refresh tokens for this user immediately
      user.tokenFamily = null;
      user.tokenFamilyIssuedAt = null;
      await user.save();
      const { clearAuthCookies } = require('../utils/tokens');
      clearAuthCookies(res);
      return next(createError('Session invalidated due to suspicious activity. Please log in again.', 401, 'UNAUTHORIZED'));
    }

    setAuthCookies(res, user._id, user.tokenFamily);

    return res.json({ success: true, data: { message: 'Session refreshed' } });
  } catch (_) {
    return next(createError('Invalid or expired refresh token. Please log in again.', 401, 'UNAUTHORIZED'));
  }
}

function logout(req, res) {
  try {
    const token = req.cookies?.[ACCESS_COOKIE_NAME] || req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      let decoded;
      try {
        const { verifyAccessToken } = require('../utils/tokens');
        decoded = verifyAccessToken(token);
      } catch (verifyErr) {

      }
      if (decoded && decoded.userId) {
        const { getIo } = require('../config/socket');
        const io = getIo();
        for (const [id, socket] of io.sockets.sockets) {
          if (socket.user && socket.user._id.toString() === decoded.userId) {
            socket.disconnect(true);
            console.log(`[Socket] Disconnected socket for logged out user: ${decoded.userId}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Logout Socket Error]:', err.message);
  }

  clearAuthCookies(res);
  return res.json({ success: true, data: { message: 'Logged out successfully.' } });
}

async function me(req, res, next) {
  try {
    // req.user is already populated by authenticate(); avoid a redundant full User fetch.
    // We only need to populate the coupleId reference that the auth middleware doesn't expand.
    const couple = req.user.coupleId
      ? await Couple.findById(req.user.coupleId).lean()
      : null;

    return res.json({
      success: true,
      data: { user: formatUser(req.user, couple) },
    });
  } catch (err) {
    next(err);
  }
}

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

    const user = await User.findById(req.user._id).populate({
      path: 'coupleId',
      populate: { path: 'members' }
    });

    return res.json({ success: true, data: { user: formatUser(user, user.coupleId) } });
  } catch (err) {
    next(err);
  }
}

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

    // Rotate tokenFamily so any previously stolen refresh token is invalidated
    user.tokenFamily = uuidv4();
    user.tokenFamilyIssuedAt = new Date();
    await user.save();

    console.warn(`[Security - Audit] Password changed for user: ${user._id}`);

    setAuthCookies(res, user._id, user.tokenFamily);

    return res.json({ success: true, data: { message: 'Password updated successfully.' } });
  } catch (err) {
    next(err);
  }
}

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

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return next(createError('No image provided.', 400, 'NO_FILE'));

    const dynamicId = req.user.coupleId?._id || req.user.coupleId || req.user._id;
    const key = `avatars/${dynamicId}/${req.file.filename}`;
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const url = `${serverUrl}/uploads/${key}`;

    const existing = await User.findById(req.user._id).select('+avatarFileId');
    if (existing?.avatarFileId) {
      try {
        const oldPath = path.join(__dirname, '..', '..', 'uploads', existing.avatarFileId);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (err) {
        console.error('[Avatar] Failed to delete old avatar:', err.message);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: url, avatarFileId: key },
      { new: true }
    ).populate('coupleId');

    return res.json({ success: true, data: { user: formatUser(user, user.coupleId) } });
  } catch (err) {

    if (req.file?.path) {
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (_) {}
    }
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
