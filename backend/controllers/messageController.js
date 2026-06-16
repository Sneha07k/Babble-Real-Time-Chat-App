const expressAsyncHandler = require("express-async-handler");
// const Message
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const { EditableRootProvider } = require("@chakra-ui/react");

const sendMessage = expressAsyncHandler(async (req, res) => {
    const { content, chatId } = req.body;
    // console.log("USER FROM TOKEN:", req.user);

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }
  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };
  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name picture");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name picture email",
    });
   await Chat.findByIdAndUpdate(chatId, {
     latestMessage: message._id,
   });
    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});


const allMessages = expressAsyncHandler(async (req, res) => {
  console.log("🔥 HIT allMessages route");

  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender")
      .populate("chat");

    console.log("🔥 POPULATED RESULT:", messages[0]);

    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { sendMessage, allMessages };
