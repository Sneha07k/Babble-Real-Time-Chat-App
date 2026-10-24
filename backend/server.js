// real environment variables (e.g. set on Render) win over the .env file
require("dotenv").config();

// tolerate "Production", stray spaces or quotes typed into a hosting dashboard;
// Render sets RENDER=true on its servers, so production is the default there
const defaultMode = process.env.RENDER ? "production" : "development";
process.env.NODE_ENV = (process.env.NODE_ENV || defaultMode)
  .trim()
  .replace(/^["']|["']$/g, "")
  .toLowerCase();
console.log(`Starting in ${process.env.NODE_ENV} mode`);

// fail fast with a clear message instead of crashing later
const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required settings in .env: ${missing.join(", ")}`);
  process.exit(1);
}
for (const [key, feature] of [
  ["GROQ_API_KEY", "AI features"],
  ["GOOGLE_CLIENT_ID", "Google sign-in"],
  ["SMTP_HOST", "emailing sign-in codes (codes will print here instead)"],
]) {
  if (!process.env[key]) console.warn(`Note: ${key} not set - ${feature} disabled`);
}

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const User = require("./models/userModel");
const Chat = require("./models/chatModel");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatRoutes = require("./routes/chatRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { ensureBabbleSetup } = require("./config/onboarding");
const presence = require("./config/presence");

connectDB()
  .then(ensureBabbleSetup)
  .catch((error) => console.error(`Setup error: ${error.message}`));

const app = express();
// Render sits in front of the app; trust it so rate limits see real client IPs
app.set("trust proxy", 1);
app.use(
  helmet({
    // the React app loads fonts, icons, images and Google's script from other sites
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    // Google sign-in opens a popup that must be able to report back
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);
app.use(express.json({ limit: "100kb" }));

app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);

// deployment code
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "frontend", "build")));
  app.use((req, res, next) => {
    // unknown /api routes should still 404 as JSON, not return the React app
    if (req.originalUrl.startsWith("/api")) return next();
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running");
  });
}
// deployment code

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`Server Started at port ${PORT}`),
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  },
});

// controllers use this to push saved messages to chat members
app.set("io", io);

// only sockets carrying a valid JWT are allowed to connect
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id name");
    if (!user) return next(new Error("Not authorized"));
    socket.userId = user._id.toString();
    socket.userName = user.name;
    next();
  } catch (error) {
    next(new Error("Not authorized"));
  }
});

// tell everyone who shares a private chat with this user that they came or went
const broadcastPresence = async (userId, online, lastSeen) => {
  const contacts = await presence.contactsOf(userId);
  contacts.forEach((id) => io.to(id).emit("presence", { userId, online, lastSeen }));
  return contacts;
};

io.on("connection", async (socket) => {
  socket.join(socket.userId);
  socket.emit("connected");

  const cameOnline = presence.connect(socket.userId);
  const contacts = cameOnline
    ? await broadcastPresence(socket.userId, true)
    : await presence.contactsOf(socket.userId);
  // and tell this user which of their contacts are online right now
  socket.emit("online users", contacts.filter(presence.isOnline));

  socket.on("disconnect", async () => {
    if (!presence.disconnect(socket.userId)) return;
    const lastSeen = new Date();
    await User.updateOne({ _id: socket.userId }, { lastSeen }).catch(() => {});
    broadcastPresence(socket.userId, false, lastSeen).catch(() => {});
  });

  socket.on("join chat", async (room) => {
    const isMember = await Chat.exists({ _id: room, users: socket.userId }).catch(
      () => null,
    );
    if (isMember) socket.join(room);
  });

  socket.on("typing", (room) => {
    if (socket.rooms.has(room)) socket.in(room).emit("typing", room, socket.userName);
  });

  socket.on("stop typing", (room) => {
    if (socket.rooms.has(room)) socket.in(room).emit("stop typing", room);
  });
});
