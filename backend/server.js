const express = require("express");
const app = express();
const dotenv= require("dotenv")
const { chats } = require("./data/data");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

connectDB = require("./config/db");

dotenv.config()
connectDB();

app.use(express.json()); 

app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", require("./routes/chatRoutes"));

app.use(notFound);
app.use(errorHandler);
app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/api/chat", (req, res) => {
  res.send(chats);
});

app.get("/api/chat/:id", (req, res) => {
    console.log(req.params.id);
    const singleChat = chats.find((c) => c._id === req.params.id)
    res.send(singleChat)
});

const PORT = process.env.PORT || 5000

app.listen(5000, console.log(`Server Started at port  ${PORT}`));
