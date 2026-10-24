const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const Chat = require("../models/chatModel");
const { onboardUser, getInviteCode } = require("../config/onboarding");
const { createAndSendOtp, verifyOtp } = require("../config/otp");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client();

// stops search text like ".*" or "(a+)+" being run as a regex
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// what the frontend stores after any successful login
const authResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  picture: user.picture,
  twoFactorEnabled: user.twoFactorEnabled,
  hasPassword: Boolean(user.password),
  token: generateToken(user._id),
});

// step 1 of sign-up: email a code to prove the address is real
const sendSignupOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Please enter your email");
  }
  if (await User.exists({ email })) {
    res.status(400);
    throw new Error("User already exists");
  }
  await createAndSendOtp(email, "signup");
  res.json({ message: "Code sent" });
});

// step 2 of sign-up: create the account only with a valid code
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, picture, otp } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Fields");
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }
  if (String(name).trim().length > 50) {
    res.status(400);
    throw new Error("Name must be 50 characters or fewer");
  }
  // only plain web images; blocks javascript: and data: URLs
  if (picture && !/^https:\/\/\S+$/i.test(picture)) {
    res.status(400);
    throw new Error("Invalid profile picture");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  await verifyOtp(email, "signup", otp);

  const newUser = await User.create({
    name: String(name).trim(),
    email,
    password,
    // an empty string would override the schema's default picture
    ...(picture ? { picture } : {}),
  });

  if (newUser) {
    await onboardUser(newUser);
    res.status(201).json(authResponse(newUser));
  } else {
    res.status(400);
    throw new Error("Failed to Create the User");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && !user.isBot && (await user.matchPassword(password))) {
    if (user.twoFactorEnabled) {
      try {
        await createAndSendOtp(user.email, "login");
      } catch (error) {
        // a code was sent less than a minute ago; the user can still use it
        if (error.status !== 429) throw error;
      }
      return res.json({ twoFactorRequired: true, email: user.email });
    }
    await onboardUser(user);
    res.json(authResponse(user));
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

// second step of a two-step login; the code only exists if the password was right
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.twoFactorEnabled) {
    res.status(400);
    throw new Error("Invalid request");
  }
  await verifyOtp(user.email, "login", otp);
  await onboardUser(user);
  res.json(authResponse(user));
});

const googleAuth = asyncHandler(async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(500);
    throw new Error("Google sign-in is not configured on the server");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential,
      // rejects tokens Google issued for some other website
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    res.status(401);
    throw new Error("Google sign-in failed");
  }
  if (!payload.email_verified) {
    res.status(401);
    throw new Error("Your Google email is not verified");
  }

  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    user = await User.findOne({ email: payload.email });
    if (user?.isBot) {
      res.status(401);
      throw new Error("Google sign-in failed");
    }
    if (user) {
      // Google has proven they own this email, so link the accounts
      user.googleId = payload.sub;
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        googleId: payload.sub,
        ...(payload.picture ? { picture: payload.picture } : {}),
      });
    }
  }

  await onboardUser(user);
  res.json(authResponse(user));
});

const setTwoFactor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.enabled && !user.password) {
    res.status(400);
    throw new Error("Two-step verification protects password logins; your account uses Google");
  }
  user.twoFactorEnabled = Boolean(req.body.enabled);
  await user.save();
  res.json({ twoFactorEnabled: user.twoFactorEnabled });
});

const allUsers = asyncHandler(async (req, res) => {
  const search = req.query.search ? escapeRegex(String(req.query.search)) : "";
  const keyword = search ? {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ]
  } : {};

  const users = await User.find({
    ...keyword,
    _id: { $ne: req.user._id },
    isBot: { $ne: true },
  })
    .select(User.PUBLIC_FIELDS)
    .limit(20);
  res.send(users);
}
);

// the logged-in user's personal invite code
const getMyInvite = asyncHandler(async (req, res) => {
  const code = await getInviteCode(req.user._id);
  res.json({ code });
});

// public: lets the signup page show "<name> invited you"
const getInviteInfo = asyncHandler(async (req, res) => {
  const inviter = await User.findOne({ inviteCode: req.params.code }).select(
    "name picture",
  );
  if (!inviter) {
    res.status(404);
    throw new Error("This invite link is not valid");
  }
  res.json({ name: inviter.name, picture: inviter.picture });
});

// opens (or creates) a 1:1 chat between the invited user and the inviter
const acceptInvite = asyncHandler(async (req, res) => {
  const inviter = await User.findOne({ inviteCode: req.params.code });
  if (!inviter) {
    res.status(404);
    throw new Error("This invite link is not valid");
  }
  if (inviter._id.equals(req.user._id)) {
    res.status(400);
    throw new Error("That's your own invite link — share it with a friend!");
  }

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user._id, inviter._id], $size: 2 },
  });
  const isNew = !chat;
  if (isNew) {
    chat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, inviter._id],
    });
  }
  chat = await Chat.findById(chat._id)
    .populate("users", User.PUBLIC_FIELDS)
    .populate("latestMessage");

  if (isNew) {
    req.app.get("io").to(inviter._id.toString()).emit("new chat", chat);
  }
  res.json(chat);
});

module.exports = {
  sendSignupOtp,
  registerUser,
  authUser,
  verifyLoginOtp,
  googleAuth,
  setTwoFactor,
  allUsers,
  getMyInvite,
  getInviteInfo,
  acceptInvite,
};
