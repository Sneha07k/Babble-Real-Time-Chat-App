const crypto = require("crypto");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const { DEFAULT_COMMUNITIES } = require("./constants");

const BOT_EMAIL = "babble-ai@babble.bot";
const BOT_PICTURE = "https://api.dicebear.com/9.x/bottts/png?seed=Babble";
// new users start inside this room; the rest are on the Explore page
const STARTER_ROOM = "General";

const welcomeText = (name) =>
  `Hi ${name}! 👋 I'm Babble AI, your first contact here. ` +
  `Ask me anything, or ask how Babble works. ` +
  `You're already in the General room. Open Explore to find more communities ` +
  `or join a random one, and invite friends with your personal link or QR code.`;

const getBotUser = async () => {
  const bot = await User.findOne({ email: BOT_EMAIL });
  if (bot) return bot;
  return User.create({
    name: "Babble AI",
    email: BOT_EMAIL,
    // nobody logs in as the bot; this just satisfies the schema
    password: crypto.randomBytes(32).toString("hex"),
    picture: BOT_PICTURE,
    isBot: true,
    onboarded: true,
  });
};

// runs once at server start: makes sure the bot and the rooms exist
const ensureBabbleSetup = async () => {
  const bot = await getBotUser();
  for (const room of DEFAULT_COMMUNITIES) {
    await Chat.updateOne(
      { isCommunity: true, chatName: room.chatName },
      {
        $setOnInsert: {
          isGroupChat: true,
          users: [bot._id],
          groupAdmin: bot._id,
        },
      },
      { upsert: true },
    );
    // rooms created by older versions have no emoji/description yet
    await Chat.updateOne(
      { isCommunity: true, chatName: room.chatName, emoji: { $exists: false } },
      { $set: { emoji: room.emoji, category: room.category, description: room.description } },
    );
  }

  // messages from before read receipts existed count as read by everyone
  const chatsWithOldMessages = await Message.distinct("chat", { readBy: { $exists: false } });
  for (const chatId of chatsWithOldMessages) {
    const chat = await Chat.findById(chatId).select("users");
    await Message.updateMany(
      { chat: chatId, readBy: { $exists: false } },
      { $set: { readBy: chat ? chat.users : [] } },
    );
  }
};

// gives a user the AI chat and the community rooms, once per account;
// existing accounts get this on their next login
const onboardUser = async (user) => {
  if (user.onboarded || user.isBot) return;

  const bot = await getBotUser();

  await Chat.updateOne(
    { isCommunity: true, chatName: STARTER_ROOM },
    { $addToSet: { users: user._id } },
  );

  const existing = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [user._id, bot._id] },
  });
  if (!existing) {
    const botChat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [user._id, bot._id],
    });
    const welcome = await Message.create({
      sender: bot._id,
      content: welcomeText(user.name),
      chat: botChat._id,
      readBy: [bot._id],
    });
    await Chat.findByIdAndUpdate(botChat._id, { latestMessage: welcome._id });
  }

  await User.updateOne({ _id: user._id }, { onboarded: true });
};

const getInviteCode = async (userId) => {
  const user = await User.findById(userId).select("+inviteCode");
  if (user.inviteCode) return user.inviteCode;
  const code = crypto.randomBytes(6).toString("base64url");
  await User.updateOne({ _id: userId }, { inviteCode: code });
  return code;
};

module.exports = { ensureBabbleSetup, onboardUser, getInviteCode };
