'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Couple = require('../models/Couple');
const generateInviteCode = require('./generateInviteCode');

/**
 * Ensure development users and couple exist in the database.
 * Only called when AUTH_MODE=bypass.
 *
 * Creates:
 *   dev@tether.local   (primary dev user)
 *   dev2@tether.local  (secondary — makes isPaired=true so all couple-scoped UI works)
 * Both are members of the same development Couple.
 */
async function seedDevUsers() {
  // Already seeded?
  let devUser = await User.findOne({ email: 'dev@tether.local' }).populate('coupleId').lean();
  if (devUser) {
    console.log('[Tether] Dev mode: user ready → dev@tether.local');
    return devUser;
  }

  // Generate unique invite code
  let inviteCode;
  let attempts = 0;
  while (!inviteCode && attempts < 10) {
    const candidate = generateInviteCode();
    const exists = await Couple.findOne({ inviteCode: candidate });
    if (!exists) inviteCode = candidate;
    attempts++;
  }
  if (!inviteCode) throw new Error('Could not generate unique invite code for dev couple');

  // Create couple (no members yet)
  const couple = await Couple.create({ members: [], inviteCode });

  // Create both dev users
  const [hash1, hash2] = await Promise.all([
    bcrypt.hash('devpassword123', 10),
    bcrypt.hash('devpassword123', 10),
  ]);

  const [user1, user2] = await User.insertMany([
    { name: 'Dev User', email: 'dev@tether.local', passwordHash: hash1, coupleId: couple._id },
    { name: 'Dev Partner', email: 'dev2@tether.local', passwordHash: hash2, coupleId: couple._id },
  ]);

  // Add both to couple so isPaired = true
  couple.members = [user1._id, user2._id];
  await couple.save();

  console.log('[Tether] Dev mode: seeded dev@tether.local + dev2@tether.local');
  console.log('[Tether] Dev mode: invite code →', inviteCode);

  devUser = await User.findById(user1._id).populate('coupleId').lean();
  return devUser;
}

module.exports = seedDevUsers;
