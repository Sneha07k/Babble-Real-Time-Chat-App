const { getGroq, AI_MODEL } = require("./groq");
const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

const SYSTEM_PROMPT = `You are Babble AI, a friendly contact inside the Babble chat app.
Keep replies short (1-3 sentences), casual and helpful. Plain text only, no markdown.
If asked about the app: users can start chats with "Search User", make groups with "New Group",
join community rooms (General, Coding Help, Random) from the home screen,
invite friends with their personal invite link or QR code,
get reply ideas with the "Ask AI" button, and summarize a chat with the Catch-Up (newspaper) button.`;

const FALLBACK_REPLY =
  "Sorry, I can't think straight right now. Try me again in a moment!";

// called after a user messages the bot; the reply arrives over the socket
const replyAsBot = async ({ chatId, bot, userId, io }) => {
  const room = chatId.toString();
  const userRoom = userId.toString();

  io.to(userRoom).emit("typing", room);

  const recent = await Message.find({ chat: chatId })
    .sort({ createdAt: -1 })
    .limit(12)
    .populate("sender", "isBot");

  const history = recent.reverse().map((m) => ({
    role: m.sender?.isBot ? "assistant" : "user",
    content: m.content,
  }));

  let content = FALLBACK_REPLY;
  try {
    const completion = await getGroq().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      // reasoning models spend part of this budget thinking before answering
      max_tokens: 1024,
    });
    content = completion.choices[0].message.content?.trim() || FALLBACK_REPLY;
  } catch (error) {
    console.log("BABBLE AI ERROR:", error.message);
  }

  let reply = await Message.create({ sender: bot._id, content, chat: chatId });
  reply = await reply.populateForClient();
  await Chat.findByIdAndUpdate(chatId, { latestMessage: reply._id });

  io.to(userRoom).emit("stop typing", room);
  io.to(userRoom).emit("message received", reply);
};

module.exports = { replyAsBot };
