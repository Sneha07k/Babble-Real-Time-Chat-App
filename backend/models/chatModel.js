const mongoose = require("mongoose");

const chatModel = mongoose.Schema(
    {
        chatName: { tyep: String, trim: true },
        isGroupChat: { type: Boolean, default: false },
        users: [{ type: mongoose.Schema.Type.ObjectId, ref: "User" }],
        latestMessage: { type: mongoose.Schema.Type.ObjectId, ref: "Message" },
        groupAdmin: { type: mongoose.Schema.Type.ObjectId, ref: "User" },
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model("Chat", chatModel);
module.exports = Chat;