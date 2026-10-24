const rateLimit = require("express-rate-limit");

// same JSON shape as errorMiddleware so the frontend shows the message
const limiter = (windowMs, limit, message, byUser = false) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
    // logged-in limits follow the account, not the network it's on
    ...(byUser && {
      keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    }),
  });

// login, sign-up and Google: slows down password guessing
const authLimiter = limiter(
  15 * 60 * 1000,
  30,
  "Too many attempts. Please try again in 15 minutes",
);

// emailing codes: stops the server being used to spam inboxes
const otpLimiter = limiter(
  15 * 60 * 1000,
  10,
  "Too many code requests. Please try again later",
);

// AI calls cost money per request
const aiLimiter = limiter(
  60 * 1000,
  20,
  "You're using AI features too quickly. Wait a minute",
  true,
);

const messageLimiter = limiter(
  60 * 1000,
  60,
  "You're sending messages too quickly. Slow down a little",
  true,
);

module.exports = { authLimiter, otpLimiter, aiLimiter, messageLimiter };
