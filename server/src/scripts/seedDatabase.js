require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Couple = require('../models/Couple');
const Memory = require('../models/Memory');
const GalleryPhoto = require('../models/GalleryPhoto');
const Category = require('../models/Category');
const LetterPage = require('../models/LetterPage');
const SavedReel = require('../models/SavedReel');

const connectDB = require('../config/db');

async function seedDatabase() {
  try {
    await connectDB();

    console.log('Clearing database before seeding...');
    await Promise.all([
      User.deleteMany({}),
      Couple.deleteMany({}),
      Memory.deleteMany({}),
      GalleryPhoto.deleteMany({}),
      Category.deleteMany({}),
      LetterPage.deleteMany({}),
      SavedReel.deleteMany({})
    ]);

    console.log('Seeding database with dummy data...');

    // 1. Create Couple
    const couple = await Couple.create({
      inviteCode: 'TESTCOUPLE123',
      coupleNickname: 'John & Jane',
      relationshipStatus: 'Married',
      coupleBio: 'Living our best life together since forever.',
      anniversaryDate: new Date('2020-01-01'),
      milestones: [
        { title: 'First Date', date: new Date('2018-05-15'), description: 'Coffee at the local shop.' },
        { title: 'Got Engaged', date: new Date('2019-12-25'), description: 'Under the stars.' }
      ],
      bucketList: [
        { title: 'Visit Japan', isCompleted: false },
        { title: 'Skydiving', isCompleted: true }
      ],
      interactions: { hugCount: 150, kissCount: 300 }
    });

    // 2. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash,
      coupleId: couple._id,
      role: 'admin',
      nickname: 'Johnny',
      gender: 'boy',
      dateOfBirth: new Date('1995-06-15'),
      bio: 'Loves photography and hiking.',
      favouriteColour: 'Blue',
      avatarUrl: 'https://picsum.photos/seed/john/200/200',
      onboardingComplete: true,
      currentStatus: 'happy',
      hugsSent: 75
    });

    const user2 = await User.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      passwordHash,
      coupleId: couple._id,
      role: 'partner',
      nickname: 'Janey',
      gender: 'girl',
      dateOfBirth: new Date('1996-08-22'),
      bio: 'Avid reader and coffee enthusiast.',
      favouriteColour: 'Red',
      avatarUrl: 'https://picsum.photos/seed/jane/200/200',
      onboardingComplete: true,
      currentStatus: 'busy',
      hugsSent: 80
    });

    // Update couple with members
    couple.members = [user1._id, user2._id];
    await couple.save();

    // 3. Create Categories
    const categoriesData = [
      { name: 'Trips', icon: '✈️' },
      { name: 'Food', icon: '🍔' },
      { name: 'Dates', icon: '❤️' },
      { name: 'Pets', icon: '🐶' },
      { name: 'Home', icon: '🏠' }
    ];
    
    const categories = [];
    for (const cat of categoriesData) {
      const category = await Category.create({ ...cat, coupleId: couple._id });
      categories.push(category);
    }

    // 4. Create Memories (500 dummy memories)
    const memories = [];
    for (let i = 1; i <= 500; i++) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomUser = Math.random() > 0.5 ? user1 : user2;
      const numImages = Math.floor(Math.random() * 3) + 1; // 1 to 3 images per memory
      
      const images = [];
      for (let j = 0; j < numImages; j++) {
        images.push({
          url: `https://picsum.photos/seed/mem${i}_img${j}/800/600`,
          key: `dummy/memory_${i}_img${j}.jpg`
        });
      }

      memories.push({
        coupleId: couple._id,
        title: `Amazing Memory ${i}`,
        description: `This is the description for our amazing memory number ${i}. We had so much fun!`,
        dateTaken: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random date in the past
        location: `Location ${i}`,
        images,
        categoryId: randomCategory._id,
        createdBy: randomUser._id
      });
    }
    
    await Memory.insertMany(memories);

    // 5. Create Gallery Photos (500 dummy photos)
    const galleryPhotos = [];
    for (let i = 1; i <= 500; i++) {
      const randomUser = Math.random() > 0.5 ? user1 : user2;
      galleryPhotos.push({
        coupleId: couple._id,
        uploadedBy: randomUser._id,
        url: `https://picsum.photos/seed/gal${i}/800/600`,
        key: `dummy/gallery_${i}.jpg`,
        title: `Gallery Photo ${i}`,
        caption: `A beautiful moment captured in time - ${i}`,
        dateTaken: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        location: `Gallery Location ${i}`
      });
    }

    await GalleryPhoto.insertMany(galleryPhotos);

    // 6. Create Letter Pages (100 dummy letters)
    const letterPages = [];
    for (let i = 1; i <= 100; i++) {
      const randomUser = Math.random() > 0.5 ? user1 : user2;
      letterPages.push({
        coupleId: couple._id,
        slug: `love-letter-${i}`,
        title: `Love Letter ${i}`,
        content: {
          greeting: `My dearest,`,
          body: `This is love letter number ${i}. I'm writing this to tell you how much you mean to me and how grateful I am for every single day we spend together. You are my sunshine.`,
          closing: `Forever yours,`
        },
        templateId: ['classic', 'minimal', 'scrapbook', 'elegant', 'vintage'][Math.floor(Math.random() * 5)],
        createdBy: randomUser._id
      });
    }
    await LetterPage.insertMany(letterPages);

    // 7. Create Saved Reels (100 dummy reels)
    const savedReels = [];
    for (let i = 1; i <= 100; i++) {
      const randomUser = Math.random() > 0.5 ? user1 : user2;
      savedReels.push({
        coupleId: couple._id,
        savedBy: randomUser._id,
        platform: Math.random() > 0.5 ? 'instagram' : 'tiktok',
        url: `https://example.com/reel/${i}`,
        title: `Funny Reel ${i}`,
        thumbnailUrl: `https://picsum.photos/seed/reel${i}/300/500`,
        description: `This made me think of you - ${i}`
      });
    }
    await SavedReel.insertMany(savedReels);

    console.log('Database seeded successfully!');
    console.log(`Created Couple: ${couple.inviteCode}`);
    console.log(`Created Users: ${user1.email} / password123 & ${user2.email} / password123`);
    console.log(`Created ${categories.length} Categories`);
    console.log(`Created 500 Memories`);
    console.log(`Created 500 Gallery Photos`);
    console.log(`Created 100 Letters`);
    console.log(`Created 100 Saved Reels`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
