import { Router } from "express";
import { db, messagesTable } from "@workspace/db";
import { SendMessageBody } from "@workspace/api-zod";
import { sendContactNotification } from "../lib/email";

const router = Router();

router.post("/contact", async (req, res) => {
  try {
    const body = SendMessageBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ success: false, message: "Invalid request body" });
      return;
    }

    await db.insert(messagesTable).values(body.data);

    sendContactNotification(body.data).catch((err) => {
      req.log.error({ err }, "Failed to send email notification");
    });

    res.status(201).json({ success: true, message: "Message received. Thank you!" });
  } catch (err) {
    req.log.error({ err }, "Failed to save contact message");
    res.status(500).json({ success: false, message: "Failed to send message. Please try again." });
  }
});

export default router;
