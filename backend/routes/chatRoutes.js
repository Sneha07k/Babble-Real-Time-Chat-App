const express = require("express");
const router = express.Router();
const {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
    fetchCommunityRooms,
    joinCommunityRoom,
    joinRandomCommunity,
    createCommunity,
    setChatTheme,
} = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");

router.route('/').post(protect, accessChat);
router.route('/').get(protect, fetchChats);
router.route('/group').post(protect, createGroupChat);
router.route('/rename').put(protect, renameGroup);
router.route('/groupadd').put(protect, addToGroup);
router.route('/groupremove').put(protect, removeFromGroup);
router.route('/community').get(protect, fetchCommunityRooms).post(protect, createCommunity);
router.route('/community/random').post(protect, joinRandomCommunity);
router.route('/community/:chatId/join').put(protect, joinCommunityRoom);
router.route('/:chatId/theme').put(protect, setChatTheme);


module.exports = router;
