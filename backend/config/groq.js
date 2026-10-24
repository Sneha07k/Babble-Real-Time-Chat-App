const Groq = require("groq-sdk");

// one place to change the model used by every AI feature
const AI_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

let client;

// created on first use so a missing key disables AI instead of crashing the server
const getGroq = () => {
  if (!process.env.GROQ_API_KEY) {
    throw Object.assign(new Error("AI is not configured on the server"), {
      status: 503,
    });
  }
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
};

module.exports = { getGroq, AI_MODEL };
