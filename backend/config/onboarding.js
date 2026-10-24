const crypto = require("crypto");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");

const BOT_EMAIL = "babble-ai@babble.bot";
const BOT_PICTURE = "https://api.dicebear.com/9.x/bottts/png?seed=Babble";
const COMMUNITY_ROOMS = ["General", "Coding Help", "Random"];

const welcomeText = (name) =>
  `Hi ${name}! 👋 I'm Babble AI, your first contact here. ` +
  `Ask me anything, or ask how Babble works. ` +
  `You've also been added to the community rooms, and you can invite friends ` +
  `with your personal link or QR code from the home screen.`;

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
  for (const chatName of COMMUNITY_ROOMS) {
    await Chat.updateOne(
      { isCommunity: true, chatName },
      {
        $setOnInsert: {
          isGroupChat: true,
          users: [bot._id],
          groupAdmin: bot._id,
        },
      },
      { upsert: true },
    );
  }
};

// gives a user the AI chat and the community rooms, once per account;
// existing accounts get this on their next login
const onboardUser = async (user) => {
  if (user.onboarded || user.isBot) return;

  const bot = await getBotUser();

  await Chat.updateMany(
    { isCommunity: true },
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
