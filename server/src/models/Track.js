const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  coupleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Couple',
    required: true,
    index: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  audioData: {
    type: Buffer,
  },
  contentType: {
    type: String,
  },
  url: {
    type: String,
  }
}, {
  timestamps: true,
});

trackSchema.index({ coupleId: 1, createdAt: -1 });

const Track = mongoose.model('Track', trackSchema);

module.exports = Track;
