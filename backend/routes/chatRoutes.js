const express = require("express");
const router = express.Router();
const { accessChat } = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");
const { fetchChats } = require("../controllers/chatControllers");
const { createGroupChat } = require("../controllers/chatControllers");
const { renameGroup } = require("../controllers/chatControllers");
const { addToGroup } = require("../controllers/chatControllers");
const { removeFromGroup } = require("../controllers/chatControllers");
const { fetchCommunityRooms, joinCommunityRoom } = require("../controllers/chatControllers");

router.route('/').post(protect, accessChat);
router.route('/').get(protect, fetchChats);
router.route('/group').post(protect, createGroupChat);
router.route('/rename').put(protect, renameGroup);
router.route('/groupadd').put(protect, addToGroup);
router.route('/groupremove').put(protect, removeFromGroup);
router.route('/community').get(protect, fetchCommunityRooms);
router.route('/community/:chatId/join').put(protect, joinCommunityRoom);


module.exports = router;