const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  Name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  picture: {
    type: String,
    required: true,
    default: "https://www.vecteezy.com/free-vector/default-user",
  },
});
const User = mongoose.model("User", userSchema);       
module.exports = User;