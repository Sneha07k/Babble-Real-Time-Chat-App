const mongoose = require("mongoose");

const messageModel = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      trim: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
  },
  {
    timestamps: true,
  },
);

// the shape the frontend expects: sender + chat with its members
messageModel.methods.populateForClient = function () {
  return this.populate([
    { path: "sender", select: "name picture isBot" },
    {
      path: "chat",
      populate: { path: "users", select: "name picture email isBot" },
    },
  ]);
};

const Message = mongoose.model("Message", messageModel);
module.exports = Message;
