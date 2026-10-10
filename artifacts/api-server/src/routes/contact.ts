import { Router, type IRouter } from "express";
import { getDb, isDbConfigured, messagesTable } from "@workspace/db";
import { SendMessageBody } from "@workspace/api-zod";
import { sendContactNotification, isEmailConfigured } from "../lib/email";
import { RateLimiter } from "../lib/rate-limit";

const router: IRouter = Router();

// 5 messages per hour per IP. In-memory: resets on deploy, which is fine here.
const limiter = new RateLimiter({ max: 5, windowMs: 60 * 60 * 1000 });

router.post("/contact", async (req, res) => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Please fill in every field with a valid email." });
    return;
  }

  const { website, ...data } = parsed.data;

  // Honeypot: real users never see this field.
  if (website && website.trim() !== "") {
    res.status(201).json({ success: true, message: "Message received. Thank you!" });
    return;
  }

  if (!limiter.allow(req.ip ?? "unknown")) {
    res.status(429).json({ success: false, message: "Too many messages from this address. Try again in an hour." });
    return;
  }

  const message = {
    name: data.name.trim(),
    email: data.email.trim(),
    subject: data.subject.trim(),
    body: data.body.trim(),
  };

  let stored = false;
  if (isDbConfigured) {
    try {
      await getDb().insert(messagesTable).values(message);
      stored = true;
    } catch (err) {
      req.log.error({ err }, "Failed to store contact message");
    }
  }

  let emailed = false;
  if (isEmailConfigured()) {
    try {
      await sendContactNotification(message);
      emailed = true;
    } catch (err) {
      req.log.error({ err }, "Failed to send contact notification email");
    }
  } else {
    req.log.warn("No email provider configured (GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY)");
  }

  if (!stored && !emailed) {
    res.status(500).json({ success: false, message: "Could not deliver your message. Email me directly instead." });
    return;
  }

  res.status(201).json({ success: true, message: "Message received. I reply from my Gmail, usually within a day." });
});

export default router;
