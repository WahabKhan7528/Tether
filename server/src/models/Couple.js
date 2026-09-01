'use strict';

const mongoose = require('mongoose');

const coupleSchema = new mongoose.Schema(
  {
    members: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (arr) => arr.length <= 2,
        message: 'A couple cannot have more than 2 members',
      },
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    coupleNickname: {
      type: String,
      trim: true,
      maxlength: [60, 'Couple nickname cannot exceed 60 characters'],
      default: '',
    },
    relationshipStatus: {
      type: String,
      trim: true,
      maxlength: [40, 'Relationship status cannot exceed 40 characters'],
      default: 'Dating',
    },
    coupleBio: {
      type: String,
      trim: true,
      maxlength: [200, 'Couple bio cannot exceed 200 characters'],
      default: '',
    },
    anniversaryDate: {
      type: Date,
      default: null,
    },
    milestones: [
      {
        title: { type: String, required: true },
        date: { type: Date, required: true },
        description: { type: String, default: '' },
      }
    ],
    bucketList: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    interactions: {
      hugCount: { type: Number, default: 0 },
      kissCount: { type: Number, default: 0 },
    },
    dateIdeas: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true }
);



const Couple = mongoose.model('Couple', coupleSchema);
module.exports = Couple;
