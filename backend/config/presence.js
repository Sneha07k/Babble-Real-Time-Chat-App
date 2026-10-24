const Chat = require("../models/chatModel");

// userId -> number of open tabs/devices; in memory, so it resets on restart
const openSockets = new Map();

const isOnline = (userId) => openSockets.has(String(userId));

// returns true when this is the user's first open tab (they just came online)
const connect = (userId) => {
  const id = String(userId);
  const count = openSockets.get(id) || 0;
  openSockets.set(id, count + 1);
  return count === 0;
};

// returns true when the user's last tab closed (they just went offline)
const disconnect = (userId) => {
  const id = String(userId);
  const count = (openSockets.get(id) || 1) - 1;
  if (count <= 0) {
    openSockets.delete(id);
    return true;
  }
  openSockets.set(id, count);
  return false;
};

// people who should see this user's status: anyone sharing a private chat
// (big public rooms are left out so strangers can't track you)
const contactsOf = async (userId) => {
  const chats = await Chat.find({ users: userId, isCommunity: { $ne: true } }).select("users");
  const ids = new Set();
  chats.forEach((c) => c.users.forEach((u) => ids.add(String(u))));
  ids.delete(String(userId));
  return [...ids];
};

module.exports = { isOnline, connect, disconnect, contactsOf };
