const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

console.log("USER MODEL FILE LOADED");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    picture: {
      type: String,
      // required: true,
      default:
        "https://i.pinimg.com/736x/24/a5/4c/24a54c075ae7a7e7ae16d69e2766cefe.jpg",
    },
  },
  { timestamps: true },
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
} 

userSchema.pre("save", async function () {
  console.log("PRE SAVE HOOK FIRED");

  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model("User", userSchema);       
module.exports = User;