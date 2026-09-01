const express = require('express');
const router = express.Router();
const { authenticate, requirePaired } = require('../middleware/auth');
const { createAudioUpload } = require('../config/multer');
const radyoController = require('../controllers/radyoController');

// All radyo routes require auth and couple
router.use(authenticate, requirePaired);

const upload = createAudioUpload('radyo', (req) => req.user.coupleId);

router.get('/', radyoController.getTracks);
router.get('/stream/:id', radyoController.streamTrack);
router.post('/upload', upload.single('audio'), radyoController.uploadTrack);
router.delete('/:id', radyoController.deleteTrack);

module.exports = router;
