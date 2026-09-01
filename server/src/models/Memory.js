'use strict';

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    key: { type: String, required: true }, // R2 object key
    order: { type: Number, default: 0 },
  }
);

const memorySchema = new mongoose.Schema(
  {
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    dateTaken: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [120, 'Location cannot exceed 120 characters'],
      default: '',
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

memorySchema.index({ coupleId: 1, createdAt: -1 });
memorySchema.index({ coupleId: 1, categoryId: 1 });

const Memory = mongoose.model('Memory', memorySchema);
module.exports = Memory;
