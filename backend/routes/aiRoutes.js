const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/replies", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send({ error: "Message required" });
  }

  const prompt = `
You are a smart chat assistant.

Generate 3 short, natural chat replies to this message.
Rules:
- very short (max 6 words each)
- casual tone
- return ONLY JSON array

Message:
${message}
`;

  try {
    const response = await axios.post(
      "YOUR_AI_ENDPOINT", // OpenAI or Gemini
      {
        prompt,
      },
    );

    // assume AI returns text like: ["ok","sounds good","got it"]
    const replies = JSON.parse(response.data);

    res.json(replies);
  } catch (err) {
    res.status(500).send({ error: "AI failed" });
  }
});

module.exports = router;
