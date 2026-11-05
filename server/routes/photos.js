const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Photo = require('../models/Photo');
const auth = require('../middleware/auth');

// Setup multer for image upload with absolute path
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  }
});
const upload = multer({ storage: storage });

// @route   GET /api/photos
// @desc    Get logged in user photos only
router.get('/', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const photos = await Photo.find({ user: req.user.id }).populate('user', 'username').sort({ createdAt: -1 });
      return res.json(photos);
    }
    return res.json([]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/photos
// @desc    Upload a photo
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Please upload an image' });
    }

    const category = req.body.category || 'My Photos';
    const photoData = {
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      imageUrl: `/uploads/${req.file.filename}`,
      image: `/uploads/${req.file.filename}`,
      category: category,
      album: category,
      location: req.body.location || '',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      likes: [],
      createdAt: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      const newPhoto = new Photo({
        ...photoData,
        user: req.user.id
      });
      const photo = await newPhoto.save();
      return res.json(photo);
    }

    // Fallback if Mongo is offline
    return res.json({
      _id: `srv_${Date.now()}`,
      ...photoData,
      user: { username: req.user?.username || 'You' },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/photos/:id/like
// @desc    Like/Unlike a photo
router.put('/:id/like', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(200).json({ msg: 'Curated photo like acknowledged' });
    }
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ msg: 'Photo not found' });
    }

    // Check if the photo has already been liked by this user
    if (photo.likes.some(like => like.toString() === req.user.id)) {
      // Unlike it
      photo.likes = photo.likes.filter(like => like.toString() !== req.user.id);
    } else {
      // Like it
      photo.likes.unshift(req.user.id);
    }

    await photo.save();
    res.json(photo.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/photos/:id
// @desc    Delete a photo
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(200).json({ msg: 'Curated photo deleted locally' });
    }
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ msg: 'Photo not found' });
    }

    // Ensure user owns the photo
    if (photo.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', photo.imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await photo.deleteOne();
    res.json({ msg: 'Photo removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

