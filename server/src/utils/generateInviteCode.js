'use strict';

// Avoids ambiguous characters: O, 0, I, 1
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random uppercase alphanumeric invite code.
 * @param {number} length - Default 6
 * @returns {string}
 */
function generateInviteCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

module.exports = generateInviteCode;
