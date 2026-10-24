const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Message = require("../models/messageModel");
const presence = require("../config/presence");
const { CHAT_THEMES, COMMUNITY_CATEGORIES } = require("../config/constants");

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

    // how many messages in each chat this user hasn't seen yet
    const unread = await Message.aggregate([
        {
            $match: {
                chat: { $in: results.map((c) => c._id) },
                sender: { $ne: req.user._id },
                readBy: { $ne: req.user._id },
            },
        },
        { $group: { _id: "$chat", count: { $sum: 1 } } },
    ]);
    const unreadByChat = Object.fromEntries(unread.map((u) => [String(u._id), u.count]));

    res.status(200).send(
        results.map((c) => ({ ...c.toObject(), unreadCount: unreadByChat[String(c._id)] || 0 }))
    );
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

// the bot sits in the built-in rooms; it shouldn't count as a member
const getBotId = async () => (await User.findOne({ isBot: true }).select("_id"))?._id;

const populateRoom = (query) =>
    query
        .populate("users", PUBLIC_USER_FIELDS)
        .populate("groupAdmin", PUBLIC_USER_FIELDS)
        .populate({ path: "latestMessage", populate: { path: "sender", select: "name picture" } });

// every community room for the Explore page
const fetchCommunityRooms = asyncHandler(async (req, res) => {
    const [rooms, botId] = await Promise.all([
        Chat.find({ isCommunity: true })
            .select("chatName users emoji description category createdAt latestMessage")
            .populate("latestMessage", "createdAt")
            .sort({ createdAt: 1 })
            .limit(500),
        getBotId(),
    ]);

    res.json(rooms.map((room) => {
        const people = room.users.filter((u) => !botId || !u.equals(botId));
        return {
            _id: room._id,
            chatName: room.chatName,
            emoji: room.emoji || "💬",
            description: room.description || "",
            category: room.category || "Hangout",
            memberCount: people.length,
            onlineCount: people.filter(presence.isOnline).length,
            lastActivity: room.latestMessage?.createdAt || room.createdAt,
            joined: room.users.some((u) => u.equals(req.user._id)),
        };
    }));
});

const joinCommunityRoom = asyncHandler(async (req, res) => {
    const room = await populateRoom(Chat.findOneAndUpdate(
        { _id: req.params.chatId, isCommunity: true },
        { $addToSet: { users: req.user._id } },
        { returnDocument: "after" }
    ));
    if (!room) {
        res.status(404);
        throw new Error("Room Not Found");
    }
    res.json(room);
});

// "Surprise me": drop the user into a room they're not in yet
const joinRandomCommunity = asyncHandler(async (req, res) => {
    const [pick] = await Chat.aggregate([
        { $match: { isCommunity: true, users: { $ne: req.user._id } } },
        { $sample: { size: 1 } },
        { $project: { _id: 1 } },
    ]);
    if (!pick) {
        res.status(404);
        throw new Error("You've already joined every room. Why not create one?");
    }
    const room = await populateRoom(Chat.findByIdAndUpdate(
        pick._id,
        { $addToSet: { users: req.user._id } },
        { returnDocument: "after" }
    ));
    res.json(room);
});

// anyone can start a public community; the creator becomes its admin
const createCommunity = asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim().slice(0, 40);
    const description = String(req.body.description || "").trim().slice(0, 160);
    const emoji = String(req.body.emoji || "💬").trim().slice(0, 8);
    const category = COMMUNITY_CATEGORIES.includes(req.body.category) ? req.body.category : "Hangout";

    if (name.length < 3) {
        res.status(400);
        throw new Error("Give your community a name (at least 3 characters)");
    }
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (await Chat.exists({ isCommunity: true, chatName: { $regex: `^${escaped}$`, $options: "i" } })) {
        res.status(400);
        throw new Error("A community with that name already exists");
    }
    // keeps one account from flooding Explore
    if ((await Chat.countDocuments({ isCommunity: true, groupAdmin: req.user._id })) >= 5) {
        res.status(400);
        throw new Error("You can run up to 5 communities");
    }

    const created = await Chat.create({
        chatName: name,
        description,
        emoji,
        category,
        isGroupChat: true,
        isCommunity: true,
        users: [req.user._id],
        groupAdmin: req.user._id,
    });
    res.status(201).json(await populateRoom(Chat.findById(created._id)));
});

// shared look for a chat; every member sees the change live
const setChatTheme = asyncHandler(async (req, res) => {
    const { theme } = req.body;
    if (!CHAT_THEMES.includes(theme)) {
        res.status(400);
        throw new Error("Unknown theme");
    }
    const chat = await Chat.findOne({ _id: req.params.chatId, users: req.user._id })
        .select("users theme isCommunity groupAdmin");
    if (!chat) {
        res.status(403);
        throw new Error("You are not a member of this chat");
    }
    // in public rooms only the admin may restyle it for everyone
    if (chat.isCommunity && !chat.groupAdmin?.equals(req.user._id)) {
        res.status(403);
        throw new Error("Only the room's admin can change its theme");
    }
    chat.theme = theme;
    await chat.save();

    const io = req.app.get("io");
    chat.users.forEach((u) => {
        if (u.equals(req.user._id)) return;
        io.to(String(u)).emit("chat theme", {
            chatId: String(chat._id),
            theme,
            by: req.user.name,
        });
    });
    res.json({ chatId: chat._id, theme: chat.theme });
});

module.exports = {
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
};
