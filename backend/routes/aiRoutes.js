const express = require("express");
const router = express.Router();
const { getGroq, AI_MODEL } = require("../config/groq");
const { protect } = require("../middleware/authMiddleware");
const { aiLimiter } = require("../middleware/rateLimiters");

router.post("/replies", protect, aiLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    const completion = await getGroq().chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a chat reply suggestion system. Return ONLY a JSON array of 3 short replies.",
        },
        {
          role: "user",
          content: message.slice(-2000),
        },
      ],
    });

    let text = completion.choices[0].message.content;

    text = text.replace(/```json|```/g, "").trim();

    const match = text.match(/\[.*\]/s);

    let replies;

    if (match) {
      try {
        replies = JSON.parse(match[0]);
      } catch (parseError) {
        replies = ["ok", "sounds good", "got it"];
      }
    } else {
      replies = ["ok", "sounds good", "got it"];
    }

    res.json(replies);
  } catch (err) {
    console.log("AI ERROR:", err);
    res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : "Groq failed" });
  }
});



router.post("/summarize", protect, aiLimiter, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: "Messages required" });
    }

    // keep the prompt bounded: most recent 200 messages only
    const chatText = messages
      .slice(-200)
      .map((m) => `${m.sender}: ${m.content}`)
      .join("\n");

    const completion = await getGroq().chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `
You summarize chat conversations.

Return JSON only:

{
  "summary": "...",
  "decisions": [],
  "tasks": [],
  "events": []
}
`,
        },
        {
          role: "user",
          content: chatText,
        },
      ],
    });

    let text = completion.choices[0].message.content;

    text = text.replace(/```json|```/g, "").trim();

    const match = text.match(/\{.*\}/s);
    let data;
    try {
      data = JSON.parse(match ? match[0] : text);
    } catch (parseError) {
      data = { summary: text, decisions: [], tasks: [], events: [] };
    }

    res.json(data);
  } catch (err) {
    console.log("SUMMARY ERROR:", err);
    res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : "Groq failed" });
  }
});


module.exports = router;
