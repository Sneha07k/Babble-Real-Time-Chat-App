const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Otp = require("../models/otpModel");
const { sendOtpEmail } = require("./mailer");

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

// errors carry an HTTP status so controllers can pass them straight on
const otpError = (status, message) =>
  Object.assign(new Error(message), { status });

const createAndSendOtp = async (email, purpose) => {
  email = email.toLowerCase().trim();

  const existing = await Otp.findOne({ email, purpose });
  if (existing && Date.now() - existing.updatedAt.getTime() < RESEND_COOLDOWN_MS) {
    throw otpError(429, "Please wait a minute before requesting another code");
  }

  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  await Otp.findOneAndUpdate(
    { email, purpose },
    {
      codeHash: await bcrypt.hash(code, 10),
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
    { upsert: true },
  );

  await sendOtpEmail(email, code, purpose);
};

// throws if the code is wrong/expired; a correct code can only be used once
const verifyOtp = async (email, purpose, code) => {
  email = String(email || "").toLowerCase().trim();

  const record = await Otp.findOne({ email, purpose });
  if (!record || record.expiresAt < new Date()) {
    throw otpError(400, "Code expired. Please request a new one");
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    throw otpError(429, "Too many wrong attempts. Please request a new code");
  }

  const matches = await bcrypt.compare(String(code || ""), record.codeHash);
  if (!matches) {
    record.attempts += 1;
    await record.save();
    throw otpError(400, "Incorrect code");
  }

  await record.deleteOne();
};

module.exports = { createAndSendOtp, verifyOtp };
