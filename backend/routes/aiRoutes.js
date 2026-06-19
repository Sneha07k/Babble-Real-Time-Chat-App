const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/replies", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a chat reply suggestion system. Return ONLY a JSON array of 3 short replies.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    let text = completion.choices[0].message.content;

    text = text.replace(/```json|```/g, "").trim();

    const match = text.match(/\[.*\]/s);

    let replies;

    if (match) {
      replies = JSON.parse(match[0]);
    } else {
      replies = ["ok", "sounds good", "got it"];
    }

    res.json(replies);
  } catch (err) {
    console.log("AI ERROR:", err);
    res.status(500).json({ error: "Groq failed" });
  }
});



router.post("/summarize", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages required" });
    }

    const chatText = messages
      .map((m) => `${m.sender}: ${m.content}`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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

    const data = JSON.parse(text);

    res.json(data);
  } catch (err) {
    console.log("SUMMARY ERROR:", err);
    res.status(500).json({ error: "Groq failed" });
  }
});


module.exports = router;
