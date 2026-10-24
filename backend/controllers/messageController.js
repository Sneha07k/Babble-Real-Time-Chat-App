const expressAsyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const { replyAsBot } = require("../config/babbleBot");

const sendMessage = expressAsyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (typeof content !== "string" || !content.trim() || !chatId) {
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
    .populate("sender", "name picture email")
    .populate("chat");

  res.json(messages);
});

module.exports = { sendMessage, allMessages };
