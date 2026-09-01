'use strict';

const mongoose = require('mongoose');

/**
 * GalleryPhoto — images uploaded directly from the Gallery page.
 * These are distinct from Memory images and do NOT appear in the Memories section.
 * Both sources are merged in the gallery feed with a `source` discriminator field.
 */
const galleryPhotoSchema = new mongoose.Schema(
  {
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
    url: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true, // relative storage path e.g. gallery/{coupleId}/{filename}
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
      default: '',
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [500, 'Caption cannot exceed 500 characters'],
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
  },
  { timestamps: true }
);

galleryPhotoSchema.index({ coupleId: 1, createdAt: -1 });

const GalleryPhoto = mongoose.model('GalleryPhoto', galleryPhotoSchema);
module.exports = GalleryPhoto;
