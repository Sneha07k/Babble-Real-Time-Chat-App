const nodemailer = require("nodemailer");

// Brevo sends over HTTPS, which works on hosts that block SMTP (like Render's free plan);
// Gmail SMTP stays available for local development
const useBrevo = () => Boolean(process.env.BREVO_API_KEY);
const useSmtp = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const isMailConfigured = () => useBrevo() || useSmtp();

// "Babble <me@gmail.com>" -> { name: "Babble", email: "me@gmail.com" }
const parseSender = () => {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "";
  const match = from.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  return match
    ? { name: match[1] || "Babble", email: match[2] }
    : { name: "Babble", email: from.trim() };
};

let transporter;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // give up quickly instead of hanging when a host blocks mail ports
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transporter;
};

const sendWithBrevo = async ({ to, subject, text, html }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: parseSender(),
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
};

const sendOtpEmail = async (email, code, purpose) => {
  const action = purpose === "signup" ? "verify your email" : "finish logging in";

  if (!isMailConfigured()) {
    // never silently skip verification in production
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email sending is not configured on the server");
    }
    console.log(`[DEV] OTP for ${email} (${purpose}): ${code}`);
    return;
  }

  const message = {
    to: email,
    subject: `Your Babble code: ${code}`,
    text: `Use ${code} to ${action} on Babble. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Use this code to ${action} on Babble:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
<p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  };

  if (useBrevo()) {
    await sendWithBrevo(message);
    return;
  }

  const sender = parseSender();
  await getTransporter().sendMail({
    ...message,
    from: sender.name ? `${sender.name} <${sender.email}>` : sender.email,
  });
};

module.exports = { sendOtpEmail };
