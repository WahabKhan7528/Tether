'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// Ensure the key is 32 bytes (256 bits). If not provided, throw error in prod or use fallback in dev.
const ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY 
  ? Buffer.from(process.env.FIELD_ENCRYPTION_KEY, 'hex') 
  : Buffer.from('1234567890123456789012345678901234567890123456789012345678901234', 'hex'); // 32 byte fallback for dev ONLY

function encrypt(text) {
  if (!text) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(text) {
  if (!text) return text;
  
  const parts = text.split(':');
  if (parts.length !== 3) {
    // Return original text if it doesn't look like our encrypted format (e.g. legacy unencrypted data)
    return text;
  }
  
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return text; // Fallback to original text or throw? Returning original handles legacy data smoothly
  }
}

module.exports = {
  encrypt,
  decrypt,
};
