'use strict';

const mongoose = require('mongoose');

const letterPageSchema = new mongoose.Schema(
  {
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    templateId: {
      type: String,
      enum: ['classic', 'minimal', 'scrapbook', 'elegant', 'vintage'],
      default: 'classic',
    },
    palette: {
      type: String,
      default: 'default',
    },
    content: {
      greeting: { type: String, default: '', maxlength: 120 },
      body: { type: String, default: '', maxlength: 10000 },
      closing: { type: String, default: '', maxlength: 120 },
    },
    images: [
      {
        memoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Memory' },
        imageId: { type: mongoose.Schema.Types.ObjectId },
        url: { type: String },
        key: { type: String },
        order: { type: Number, default: 0 },
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Unique slug per couple
letterPageSchema.index({ coupleId: 1, slug: 1 }, { unique: true });
// Compound index for paginated fetches scoped to a couple
letterPageSchema.index({ coupleId: 1, createdAt: -1 });

const LetterPage = mongoose.model('LetterPage', letterPageSchema);
module.exports = LetterPage;
