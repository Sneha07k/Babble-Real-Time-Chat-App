const mongoose = require("mongoose");

// one pending code per email + purpose; MongoDB deletes it when it expires
const otpSchema = mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: ["signup", "login"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;
