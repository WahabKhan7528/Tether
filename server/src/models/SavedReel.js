'use strict';

const mongoose = require('mongoose');

const savedReelSchema = new mongoose.Schema(
  {
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
      maxlength: [2048, 'URL is too long'],
    },
    platform: {
      type: String,
      enum: {
        values: ['instagram', 'tiktok', 'other'],
        message: 'Platform must be instagram, tiktok, or other',
      },
      default: 'other',
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [300, 'Caption cannot exceed 300 characters'],
      default: '',
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

savedReelSchema.index({ coupleId: 1, createdAt: -1 });
savedReelSchema.index({ coupleId: 1, categoryId: 1 });
savedReelSchema.index({ coupleId: 1, isDone: 1 });

const SavedReel = mongoose.model('SavedReel', savedReelSchema);
module.exports = SavedReel;
