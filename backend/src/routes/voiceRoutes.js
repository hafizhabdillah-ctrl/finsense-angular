const express = require('express');
// const auth = require('../middleware/auth');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/voice', upload.single('audio'), voiceController.processVoice);

module.exports = router;
