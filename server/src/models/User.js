'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // ── Core identity ──────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never returned in queries by default
    },

    // ── Couple linkage ─────────────────────────────────────────────────────────
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      default: null,
    },

    // ── Role within the couple ─────────────────────────────────────────────────
    // 'admin'   = the person who created the ecosystem (set partner credentials)
    // 'partner' = the secondary member whose credentials were set by the admin
    role: {
      type: String,
      enum: ['admin', 'partner'],
      default: 'admin',
    },

    // ── Profile — filled during onboarding ────────────────────────────────────
    nickname: {
      type: String,
      trim: true,
      maxlength: [40, 'Nickname cannot exceed 40 characters'],
      default: '',
    },
    gender: {
      type: String,
      enum: ['boy', 'girl', null],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [160, 'Bio cannot exceed 160 characters'],
      default: '',
    },
    favouriteColour: {
      type: String,
      trim: true,
      maxlength: [30, 'Colour value cannot exceed 30 characters'],
      default: '',
    },

    // ── Avatar ─────────────────────────────────────────────────────────────────
    avatarUrl: {
      type: String,
      default: null, // ImageKit delivery URL (signed by server before sending to client)
    },
    avatarFileId: {
      type: String,
      default: null, // ImageKit fileId — used to delete the old image on re-upload
      select: false, // internal only, never returned to clients
    },

    // ── Onboarding gate ────────────────────────────────────────────────────────
    onboardingComplete: {
      type: Boolean,
      default: false,
    },

    // ── Partner Knowledge ──────────────────────────────────────────────────────
    partnerKnowledge: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      }
    ],

    // ── Current Status ─────────────────────────────────────────────────────────
    // Displayed to partner on the dashboard. Default is 'happy'.
    currentStatus: {
      type: String,
      enum: ['happy', 'sad', 'busy', 'sleeping', 'stressed', 'tired', 'sick', 'energetic', 'romantic', 'angry', 'relaxed'],
      default: 'happy',
    },

    // ── Interactions ───────────────────────────────────────────────────────────
    hugsSent: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ coupleId: 1 });
// email unique index is created by unique:true above

const User = mongoose.model('User', userSchema);
module.exports = User;
