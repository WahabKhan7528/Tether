'use strict';

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [10, 'Icon must be a single emoji or short string'],
      default: '📁',
    },
  },
  { timestamps: true }
);

categorySchema.index({ coupleId: 1, createdAt: -1 });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
