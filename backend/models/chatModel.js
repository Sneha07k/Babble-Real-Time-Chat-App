const mongoose = require("mongoose");

const chatModel = mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    // public rooms anyone can find on the Explore page and join
    isCommunity: {
      type: Boolean,
      default: false,
    },
    // shown on the Explore page for community rooms
    description: { type: String, trim: true, maxlength: 160 },
    emoji: { type: String, trim: true, maxlength: 8 },
    category: { type: String, trim: true },
    // look of the chat (wallpaper + bubble colours), shared by all members
    theme: { type: String, default: "default" },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

const Chat = mongoose.model("Chat", chatModel);

module.exports = Chat;
