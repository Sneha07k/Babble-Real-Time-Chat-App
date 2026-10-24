const express = require('express');
const { sendMessage, allMessages } = require('../controllers/messageController');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { messageLimiter } = require('../middleware/rateLimiters');

router.route('/').post(protect, messageLimiter, sendMessage);
router.route("/:chatId").get(protect, allMessages);

module.exports = router;
