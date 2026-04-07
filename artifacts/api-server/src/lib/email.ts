import nodemailer from "nodemailer";
import { logger } from "./logger";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? "somuraik@gmail.com";

async function sendViaResend(data: {
  name: string;
  email: string;
  subject: string;
  body: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Portfolio Contact <${RESEND_FROM_EMAIL}>`,
      to: [NOTIFY_EMAIL],
      subject: `[Portfolio] ${data.subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #c07a2a; margin-bottom: 4px;">New message from your portfolio</h2>
          <hr style="border: 1px solid #2a2018; margin-bottom: 20px;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #888; width: 80px;">From</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #c07a2a;">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Subject</td>
              <td style="padding: 8px 0;">${data.subject}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #141010; border-left: 3px solid #c07a2a; border-radius: 2px;">
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${data.body}</p>
          </div>
          <p style="margin-top: 20px; color: #555; font-size: 12px;">Reply directly to ${data.email} to respond.</p>
        </div>
      `,
      reply_to: data.email,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `Resend API request failed (${response.status}): ${errText.slice(0, 300)}`,
    );
  }

  logger.info({ to: NOTIFY_EMAIL, from: data.email }, "Contact notification email sent via Resend");
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  body: string;
}) {
  if (RESEND_API_KEY) {
    await sendViaResend(data);
    return;
  }

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    logger.warn("Email not configured — set RESEND_API_KEY (recommended) or Gmail SMTP vars. Message stored but not sent.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Portfolio Contact" <${GMAIL_USER}>`,
    to: NOTIFY_EMAIL,
    subject: `[Portfolio] ${data.subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #c07a2a; margin-bottom: 4px;">New message from your portfolio</h2>
        <hr style="border: 1px solid #2a2018; margin-bottom: 20px;" />
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888; width: 80px;">From</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #c07a2a;">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Subject</td>
            <td style="padding: 8px 0;">${data.subject}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 16px; background: #141010; border-left: 3px solid #c07a2a; border-radius: 2px;">
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${data.body}</p>
        </div>
        <p style="margin-top: 20px; color: #555; font-size: 12px;">Reply directly to ${data.email} to respond.</p>
      </div>
    `,
    replyTo: data.email,
  });

  logger.info({ to: NOTIFY_EMAIL, from: data.email }, "Contact notification email sent");
}
