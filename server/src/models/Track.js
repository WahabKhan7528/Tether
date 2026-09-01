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
  url: {
    type: String,
    // Optional for backward compatibility with older files
  },
  audioData: {
    type: Buffer,
  },
  contentType: {
    type: String,
  },
  isCompressed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Track = mongoose.model('Track', trackSchema);

module.exports = Track;
