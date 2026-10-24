const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiters");

router.route("/").post(authLimiter, registerUser).get(protect,allUsers);
router.route("/otp/signup").post(otpLimiter, sendSignupOtp);
router.route("/login").post(authLimiter, authUser);
router.route("/login/verify").post(authLimiter, verifyLoginOtp);
router.route("/google").post(authLimiter, googleAuth);
router.route("/2fa").put(protect, setTwoFactor);
router.route("/invite").get(protect, getMyInvite);
router.route("/invite/:code").get(getInviteInfo);
router.route("/invite/:code/accept").post(protect, acceptInvite);

module.exports = router;
