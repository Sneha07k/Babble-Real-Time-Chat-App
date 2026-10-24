const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

console.log("USER MODEL FILE LOADED");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // accounts created with Google have no password
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: { type: String, unique: true, sparse: true },
    // when on, password logins also need a code sent to the user's email
    twoFactorEnabled: { type: Boolean, default: false },
    // updated when the user's last open tab disconnects
    lastSeen: { type: Date },
    picture: {
      type: String,
      // required: true,
      default:
        "https://i.pinimg.com/736x/24/a5/4c/24a54c075ae7a7e7ae16d69e2766cefe.jpg",
    },
    // the built-in "Babble AI" contact
    isBot: { type: Boolean, default: false },
    // set once the user has been given the AI chat and community rooms
    onboarded: { type: Boolean, default: false },
    // created on first request; hidden from other users' queries
    inviteCode: { type: String, unique: true, sparse: true, select: false },
  },
  { timestamps: true },
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  return await bcrypt.compare(enteredPassword, this.password);
} 

userSchema.pre("save", async function () {
  console.log("PRE SAVE HOOK FIRED");

  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model("User", userSchema);

// the only user fields other people are allowed to see
User.PUBLIC_FIELDS = "name email picture isBot lastSeen";

module.exports = User;