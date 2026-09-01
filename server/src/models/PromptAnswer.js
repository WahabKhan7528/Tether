'use strict';

const mongoose = require('mongoose');

const promptAnswerSchema = new mongoose.Schema(
  {
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      required: true,
      index: true,
    },
    dateString: {
      type: String,
      required: true, // Format: YYYY-MM-DD
    },
    promptId: {
      type: Number,
      required: true,
    },
    answers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

promptAnswerSchema.index({ coupleId: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('PromptAnswer', promptAnswerSchema);
