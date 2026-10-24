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
    // a photo, video or voice note stored on Cloudinary
    attachment: {
      url: String,
      kind: { type: String, enum: ["image", "video", "audio"] },
      width: Number,
      height: Number,
      duration: Number,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    // everyone who has seen the message (the sender counts as having seen it)
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

messageModel.index({ chat: 1, createdAt: 1 });

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
