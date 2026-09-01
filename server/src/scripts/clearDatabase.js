require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');

const User = require('../models/User');
const Couple = require('../models/Couple');
const Memory = require('../models/Memory');
const GalleryPhoto = require('../models/GalleryPhoto');
const LetterPage = require('../models/LetterPage');
const SavedReel = require('../models/SavedReel');
const Category = require('../models/Category');

const connectDB = require('../config/db');

async function clearDatabase() {
  try {
    await connectDB();

    console.log('Clearing database...');
    await Promise.all([
      User.deleteMany({}),
      Couple.deleteMany({}),
      Memory.deleteMany({}),
      GalleryPhoto.deleteMany({}),
      LetterPage.deleteMany({}),
      SavedReel.deleteMany({}),
      Category.deleteMany({})
    ]);
    
    console.log('Database cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearDatabase();
