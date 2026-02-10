// File: routes/sms.js
// ============================
// SMS webhook route for incoming messages
// Handles: intent detection, AI response, conversation memory, and sending via Twilio
// DRY_RUN support included to avoid sending messages during testing
// Logs AI response time with channel and language
// ============================

import express from "express";
import db from "../config/firebase.js";
import { twilioClient } from "../config/twilioClient.js";
import { detectIntentAndLanguage } from "../config/dialogflow.js";
import { extractDisease, checkIfMedical } from "../utils/ai.js";
import { generateReply } from "../utils/aiResponse.js";
import { saveConversation, updateLastDisease } from "../utils/conversation.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Extract message and sender/receiver numbers
    const body = req.body || {};
    const msg = (body.Body || "").trim();
    const from = body.From;
    const to = body.To;

    console.log("[SMS] incoming:", { from, msg });

    if (!msg) return res.status(200).send("OK");

    const wantsVoice = false; // SMS does not support voice

    // ✅ Non-medical check
    const isMedical = await checkIfMedical(msg);
    if (!isMedical) {
      const reply =
        "I am a health assistant and can only answer medical questions.";

      if (process.env.DRY_RUN === "true") {
        console.log("[SMS] DRY_RUN enabled. Non-medical SMS not sent.");
        console.log("[SMS] reply:", reply);
      } else {
        await twilioClient.messages.create({
          from: process.env.TWILIO_SMS_NUMBER,
          to: from,
          body: reply,
        });
      }

      return res.status(200).send("OK");
    }

    // ✅ Detect intent & language
    const dialogData = await detectIntentAndLanguage(msg, from);
    const intent = dialogData?.intent || "Unknown";
    const language = dialogData?.language || "unknown";

    // ✅ Disease memory: extract current disease and fetch last topic
    const currentDisease = await extractDisease(msg);
    const snap = await db.ref(`users/${from}/lastDisease`).once("value");
    const lastTopic = snap.val() || "unknown";

    const topicForAnswer =
      currentDisease !== "unknown" ? currentDisease : lastTopic;

    // ✅ Generate AI response with timing
    const startTime = performance.now();
    let reply = await generateReply(msg, intent, topicForAnswer, from);
    const endTime = performance.now();
    const aiResponseTimeMs = parseFloat((endTime - startTime).toFixed(2));
    console.log(`⏱️ AI response time: ${aiResponseTimeMs} ms`);

    // ✅ Log AI response time to Firebase (consistent format)
    try {
      await db.ref(`aiLogs/SMS/${from}/${Date.now()}`).set({
        message: msg,
        intent,
        topic: topicForAnswer,
        language,
        channel: "SMS",
        responseTimeMs: aiResponseTimeMs,
      });
    } catch (err) {
      console.error("[SMS] Failed to log AI response time:", err);
    }

    // ✅ SMS length safety
    if (reply.length > 1500) reply = reply.slice(0, 1497) + "...";

    // ✅ Save conversation & update memory
    await saveConversation(from, to, msg, intent, reply, wantsVoice, "sms");
    await updateLastDisease(from, currentDisease);

    // ✅ Send SMS
    if (process.env.DRY_RUN === "true") {
      console.log("[SMS] DRY_RUN enabled. SMS not sent.");
      console.log("[SMS] reply:", reply);
    } else {
      await twilioClient.messages.create({
        from: process.env.TWILIO_SMS_NUMBER,
        to: from,
        body: reply,
      });
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("[SMS] error:", err);
    res.status(500).send("Error");
  }
});

export default router;
