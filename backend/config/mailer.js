const nodemailer = require("nodemailer");

const isMailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
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

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Your Babble code: ${code}`,
    text: `Use ${code} to ${action} on Babble. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Use this code to ${action} on Babble:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
<p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
};

module.exports = { sendOtpEmail };
