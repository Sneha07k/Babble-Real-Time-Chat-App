const express = require('express');
const { sendMessage } = require('../controllers/messageController');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { allMessages } = require("../controllers/messageController");

router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, allMessages);

module.exports = router;


