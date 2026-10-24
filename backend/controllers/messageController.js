const expressAsyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const { replyAsBot } = require("../config/babbleBot");
const { CLOUDINARY_CLOUD_NAME } = require("../config/constants");

const ATTACHMENT_KINDS = ["image", "video", "audio"];

// media must be a file uploaded to our own Cloudinary account, not any URL
const cleanAttachment = (attachment) => {
  if (!attachment) return null;
  const { url, kind, width, height, duration } = attachment;
  const ourCloud = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/`;
  if (typeof url !== "string" || !url.startsWith(ourCloud) || !ATTACHMENT_KINDS.includes(kind)) {
    return undefined;
  }
  const num = (n) => (Number.isFinite(Number(n)) ? Number(n) : undefined);
  return { url, kind, width: num(width), height: num(height), duration: num(duration) };
};

const sendMessage = expressAsyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const content = typeof req.body.content === "string" ? req.body.content : "";
  const attachment = cleanAttachment(req.body.attachment);

  if (attachment === undefined) {
    res.status(400);
    throw new Error("Invalid attachment");
  }
  // a message needs text, a file, or both (a photo with a caption)
  if ((!content.trim() && !attachment) || !chatId) {
    res.status(400);
    throw new Error("Invalid data passed into request");
  }
  if (content.length > 5000) {
    res.status(400);
    throw new Error("Message is too long (max 5000 characters)");
  }

  const isMember = await Chat.exists({ _id: chatId, users: req.user._id });
  if (!isMember) {
    res.status(403);
    throw new Error("You are not a member of this chat");
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    readBy: [req.user._id],
    ...(attachment && { attachment }),
  };
  try {
    var message = await Message.create(newMessage);
    message = await message.populateForClient();
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });

    // the server (not the sender's browser) delivers the saved message,
    // so nobody can fake a message from someone else
    const io = req.app.get("io");
    message.chat.users.forEach((user) => {
      if (user._id.equals(req.user._id)) return;
      io.to(user._id.toString()).emit("message received", message);
    });

    res.json(message);

    // a 1:1 chat with Babble AI: answer in the background
    const bot = message.chat.users.find((u) => u.isBot);
    if (bot && !message.chat.isGroupChat) {
      replyAsBot({ chatId, bot, userId: req.user._id, io }).catch((error) =>
        console.log("BABBLE AI ERROR:", error.message),
      );
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});


const allMessages = expressAsyncHandler(async (req, res) => {
  const isMember = await Chat.exists({
    _id: req.params.chatId,
    users: req.user._id,
  });
  if (!isMember) {
    res.status(403);
    throw new Error("You are not a member of this chat");
  }

  const messages = await Message.find({ chat: req.params.chatId })
    .populate("sender", "name picture email isBot")
    .populate("chat");

  res.json(messages);
});

// the user has looked at this chat: everything in it counts as read
const markChatRead = expressAsyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.chatId, users: req.user._id }).select("users");
  if (!chat) {
    res.status(403);
    throw new Error("You are not a member of this chat");
  }

  const result = await Message.updateMany(
    { chat: chat._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } },
  );

  // tell the senders so their ✓ becomes ✓✓
  if (result.modifiedCount > 0) {
    const io = req.app.get("io");
    chat.users.forEach((u) => {
      if (u.equals(req.user._id)) return;
      io.to(u.toString()).emit("messages read", {
        chatId: chat._id.toString(),
        readerId: req.user._id.toString(),
      });
    });
  }

  res.json({ updated: result.modifiedCount });
});

module.exports = { sendMessage, allMessages, markChatRead };
