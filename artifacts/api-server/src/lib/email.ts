import nodemailer from "nodemailer";
import { logger } from "./logger";

/**
 * Contact-form notifications.
 *
 * Providers:
 *  - Gmail SMTP via nodemailer (GMAIL_USER + GMAIL_APP_PASSWORD). This is the
 *    original "Gmail feature": messages land in the owner's Gmail inbox and
 *    Reply-To is set to the sender so a normal reply goes back to them.
 *  - Resend HTTP API (RESEND_API_KEY), optional.
 *
 * EMAIL_PROVIDER picks one explicitly ("gmail" | "resend"); "auto" (default)
 * uses Resend when a key is present, else Gmail.
 */

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  body: string;
}

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? "somuraik@gmail.com";
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER ?? "auto").toLowerCase();

type Provider = "gmail" | "resend" | null;

function resolveProvider(): Provider {
  const gmailReady = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);
  const resendReady = Boolean(RESEND_API_KEY);
  if (EMAIL_PROVIDER === "gmail") return gmailReady ? "gmail" : null;
  if (EMAIL_PROVIDER === "resend") return resendReady ? "resend" : null;
  if (resendReady) return "resend";
  if (gmailReady) return "gmail";
  return null;
}

export function isEmailConfigured(): boolean {
  return resolveProvider() !== null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function singleLine(input: string): string {
  return input.replace(/[\r\n]+/g, " ").trim();
}

function renderHtml(m: ContactMessage): string {
  const name = escapeHtml(m.name);
  const email = escapeHtml(m.email);
  const subject = escapeHtml(m.subject);
  const body = escapeHtml(m.body);
  return `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#15181d;">
  <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9aa2ad;margin:0 0 8px;">soumyaraikwar.co.in · contact</p>
  <h2 style="font-size:20px;margin:0 0 16px;">New message from ${name}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:6px 0;color:#9aa2ad;width:80px;">From</td><td style="padding:6px 0;">${name} &lt;<a href="mailto:${email}" style="color:#b8732f;">${email}</a>&gt;</td></tr>
    <tr><td style="padding:6px 0;color:#9aa2ad;">Subject</td><td style="padding:6px 0;">${subject}</td></tr>
  </table>
  <div style="margin-top:16px;padding:16px;border-left:3px solid #dd9a5b;background:#f3f4f0;">
    <p style="margin:0;white-space:pre-wrap;line-height:1.6;font-size:15px;">${body}</p>
  </div>
  <p style="margin-top:20px;color:#9aa2ad;font-size:12px;">Reply to this email to answer ${name} directly.</p>
</div>`;
}

function renderText(m: ContactMessage): string {
  return `New message from ${m.name} <${m.email}>\nSubject: ${m.subject}\n\n${m.body}\n`;
}

async function sendViaResend(m: ContactMessage) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `Portfolio Contact <${RESEND_FROM_EMAIL}>`,
      to: [NOTIFY_EMAIL],
      subject: `[Portfolio] ${singleLine(m.subject)}`,
      html: renderHtml(m),
      text: renderText(m),
      reply_to: m.email,
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API request failed (${response.status}): ${errText.slice(0, 300)}`);
  }
  logger.info({ to: NOTIFY_EMAIL, provider: "resend" }, "Contact notification sent");
}

let gmailTransport: nodemailer.Transporter | null = null;

function getGmailTransport() {
  if (!gmailTransport) {
    gmailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return gmailTransport;
}

async function sendViaGmail(m: ContactMessage) {
  await getGmailTransport().sendMail({
    from: `"Portfolio Contact" <${GMAIL_USER}>`,
    to: NOTIFY_EMAIL,
    subject: `[Portfolio] ${singleLine(m.subject)}`,
    html: renderHtml(m),
    text: renderText(m),
    replyTo: `"${singleLine(m.name).replace(/"/g, "")}" <${m.email}>`,
  });
  logger.info({ to: NOTIFY_EMAIL, provider: "gmail" }, "Contact notification sent");
}

export async function sendContactNotification(m: ContactMessage): Promise<void> {
  const provider = resolveProvider();
  if (provider === "resend") return sendViaResend(m);
  if (provider === "gmail") return sendViaGmail(m);
  throw new Error("No email provider configured");
}
