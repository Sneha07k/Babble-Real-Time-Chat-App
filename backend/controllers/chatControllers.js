const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const PUBLIC_USER_FIELDS = User.PUBLIC_FIELDS;

const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        res.status(400);
        throw new Error("UserId param not sent with request");
    }
    if (String(userId) === String(req.user._id)) {
        res.status(400);
        throw new Error("You can't start a chat with yourself");
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } }
        ]
    }).populate("users", PUBLIC_USER_FIELDS).populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name email picture"
    });
    if(isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        if (!(await User.exists({ _id: userId }))) {
            res.status(404);
            throw new Error("User not found");
        }
        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId]
        };
        var createdChat = await Chat.create(chatData);
        const fullChat = await Chat.findById(createdChat._id).populate("users", PUBLIC_USER_FIELDS);
        res.status(200).send(fullChat);
    }
});


const fetchChats = asyncHandler(async (req, res) => {
    let results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
        .populate("users", PUBLIC_USER_FIELDS)
        .populate("groupAdmin", PUBLIC_USER_FIELDS)
        .populate("latestMessage")
        .sort({ updatedAt: -1 });

    results = await User.populate(results, {
        path: "latestMessage.sender",
        select: "name email picture"
    });
    res.status(200).send(results);
});


const createGroupChat = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
        res.status(400);
        throw new Error("Please Fill all the fields");
    }
    let users;
    try {
        users = JSON.parse(req.body.users);
    } catch (error) {
        res.status(400);
        throw new Error("Invalid users list");
    }
    if (!Array.isArray(users)) {
        res.status(400);
        throw new Error("Invalid users list");
    }

    // drop duplicates and the creator (added back below as admin)
    users = [...new Set(users.map(String))].filter((id) => id !== String(req.user._id));

    if (users.length < 2) {
        res.status(400);
        throw new Error("More than 2 users are required to form a group chat");
    }
    const realUsers = await User.countDocuments({ _id: { $in: users }, isBot: { $ne: true } });
    if (realUsers !== users.length) {
        res.status(400);
        throw new Error("Some selected users don't exist");
    }
    users.push(req.user._id);

    const chatName = String(req.body.name).trim().slice(0, 60);
    if (!chatName) {
        res.status(400);
        throw new Error("Please enter a group name");
    }

    const groupChat = await Chat.create({
        chatName,
        isGroupChat: true,
        users: users,
        groupAdmin: req.user._id
    });
    const fullGroupChat = await Chat.findById(groupChat._id).populate("users", PUBLIC_USER_FIELDS).populate("groupAdmin", PUBLIC_USER_FIELDS);
    res.status(200).send(fullGroupChat);
});

// loads a group chat and checks the caller is allowed to change it
const findGroupForUpdate = async (chatId, req, res, { adminOnly }) => {
    const chat = await Chat.findOne({ _id: chatId, isGroupChat: true });
    if (!chat) {
        res.status(404);
        throw new Error("Chat Not Found");
    }
    const isMember = chat.users.some((u) => u.equals(req.user._id));
    const isAdmin = chat.groupAdmin?.equals(req.user._id);
    if (!isMember || (adminOnly && !isAdmin)) {
        res.status(403);
        throw new Error(adminOnly ? "Only the admin can do this" : "You are not a member of this group");
    }
    return chat;
};

const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;
    const chat = await findGroupForUpdate(chatId, req, res, { adminOnly: false });
    if (chat.isCommunity) {
        res.status(403);
        throw new Error("Community rooms can't be renamed");
    }
    const newName = String(chatName || "").trim().slice(0, 60);
    if (!newName) {
        res.status(400);
        throw new Error("Please enter a group name");
    }
    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { chatName: newName },
        { returnDocument: "after" }
    ).populate("users", PUBLIC_USER_FIELDS).populate("groupAdmin", PUBLIC_USER_FIELDS);
    res.json(updatedChat);
});

const addToGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;
    await findGroupForUpdate(chatId, req, res, { adminOnly: true });
    if (!(await User.exists({ _id: userId, isBot: { $ne: true } }))) {
        res.status(404);
        throw new Error("User not found");
    }
    const added = await Chat.findByIdAndUpdate(
        chatId,
        { $addToSet: { users: userId } },
        { returnDocument: "after" }
    ).populate("users", PUBLIC_USER_FIELDS).populate("groupAdmin", PUBLIC_USER_FIELDS);
    res.json(added);
});

const removeFromGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;
    // anyone may leave; only the admin may remove other people
    const leavingSelf = String(userId) === String(req.user._id);
    const chat = await findGroupForUpdate(chatId, req, res, { adminOnly: !leavingSelf });

    const remaining = chat.users.filter((u) => String(u) !== String(userId));
    const update = { $pull: { users: userId } };
    // if the admin leaves, hand the group to the longest-standing member
    if (chat.groupAdmin?.equals(userId) && remaining.length > 0) {
        update.$set = { groupAdmin: remaining[0] };
    }

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        update,
        { returnDocument: "after" }
    ).populate("users", PUBLIC_USER_FIELDS).populate("groupAdmin", PUBLIC_USER_FIELDS);
    res.json(removed);
});

// all community rooms, with size and whether the caller is already inside
const fetchCommunityRooms = asyncHandler(async (req, res) => {
    const rooms = await Chat.find({ isCommunity: true })
        .select("chatName users")
        .sort({ createdAt: 1 });
    res.json(rooms.map((room) => ({
        _id: room._id,
        chatName: room.chatName,
        // the bot is a member of every room, so don't count it
        memberCount: Math.max(room.users.length - 1, 0),
        joined: room.users.some((u) => u.equals(req.user._id)),
    })));
});

const joinCommunityRoom = asyncHandler(async (req, res) => {
    const room = await Chat.findOneAndUpdate(
        { _id: req.params.chatId, isCommunity: true },
        { $addToSet: { users: req.user._id } },
        { returnDocument: "after" }
    ).populate("users", PUBLIC_USER_FIELDS).populate("groupAdmin", PUBLIC_USER_FIELDS).populate("latestMessage");
    if (!room) {
        res.status(404);
        throw new Error("Room Not Found");
    }
    res.json(room);
});

module.exports = { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup, fetchCommunityRooms, joinCommunityRoom };
