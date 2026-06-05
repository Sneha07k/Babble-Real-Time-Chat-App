const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

console.log("USER MODEL FILE LOADED");

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  picture: {
    type: String,
    // required: true,
    default: "https://www.vecteezy.com/free-vector/default-user",
  },
},
  {timestamps: true}
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