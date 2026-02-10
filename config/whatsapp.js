// File: config/whatsapp.js
// ============================
// WhatsApp webhook route for incoming messages
// Handles: intent detection, AI response, TTS, and sending via Twilio
// Logs AI response time to Firebase
// ============================

import express from "express";
import { twilioClient } from "../config/twilioClient.js";
import db from "../config/firebase.js";
import { detectIntentAndLanguage } from "../config/dialogflow.js";
import { saveConversation, updateLastDisease } from "../utils/conversation.js";
import { extractDisease } from "../utils/ai.js";
import { handleNonMedical } from "../utils/medicalCheck.js";
import {
  normalizeWhatsAppNumber,
  detectVoiceRequest,
} from "../utils/preprocess.js";
import { sendWhatsAppMessage } from "../utils/sendMessage.js";
import { generateReply } from "../utils/aiResponse.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Extract incoming message and sender/receiver numbers
    const body = req.body || {};
    let msg = (body.Body || "").trim();
    const from = normalizeWhatsAppNumber(body.From);
    const to = normalizeWhatsAppNumber(body.To);
    console.log("[WHATSAPP] incoming:", { from, to, msg });

    // Detect if user wants a voice response
    const voiceData = detectVoiceRequest(msg);
    msg = voiceData.cleanedText;
    const wantsVoice = voiceData.wantsVoice;

    if (!msg) msg = "Hello";

    // ✅ Check if message is medical; skip processing if not
    const isMedical = await handleNonMedical(from, msg);
    if (!isMedical) return res.status(200).send("OK");

    // Reference for saving conversation
    const convoRef = db.ref("conversations").push();

    // 1️⃣ Detect intent and language
    let dialogData = await detectIntentAndLanguage(msg, from);
    let { intent } = dialogData || {};
    console.log(`🤖 Intent detected: ${intent} | User: ${msg}`);

    // ✅ Extract disease from current message (for next turn)
    let currentDisease = await extractDisease(msg);
    console.log("🧠 Current message disease:", currentDisease);

    // ✅ Fetch last disease from memory (previous turn)
    const lastTopicSnap = await db
      .ref(`users/${from}/lastDisease`)
      .once("value");
    let lastTopic = lastTopicSnap.val() || "unknown";

    // Decide topic for this response
    const topicForAnswer =
      currentDisease !== "unknown" ? currentDisease : lastTopic;
    console.log("🗣️ Topic used for answer:", topicForAnswer);
    console.log("✅ Using last topic (previous turn):", lastTopic);

    // Ensure fallback topic
    lastTopic = lastTopic || "unknown";
    console.log(
      "✅ Last topic determined (most recent disease/condition):",
      lastTopic
    );

    // 2️⃣ Generate AI response (modularized) with timing
    const startTime = performance.now();
    let shortReply = await generateReply(msg, intent, topicForAnswer);
    const endTime = performance.now();
    const aiResponseTime = (endTime - startTime).toFixed(2);
    console.log(`⏱️ AI response time: ${aiResponseTime} ms`);

    // ✅ Log AI response time to Firebase
    try {
      await db.ref(`aiLogs/WhatsApp/${from}/${Date.now()}`).set({
        message: msg,
        intent,
        topic: topicForAnswer,
        language: dialogData?.language || "unknown",
        channel: "WhatsApp",
        responseTimeMs: parseFloat(aiResponseTime),
      });
    } catch (err) {
      console.error("[WHATSAPP] Failed to log AI response time:", err);
    }

    // Clean up AI response formatting
    shortReply = shortReply
      .replace(/^[#*]+\s?/gm, "- ")
      .replace(/\([^)]+\)/g, "")
      .replace(/[^\p{L}\p{N}\s.,?!-]/gu, "")
      .replace(/(\r\n|\r|\n)+/g, "\n")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (shortReply.length > 1500)
      shortReply = shortReply.slice(0, 1497) + "...";

    // 3️⃣ Save conversation & memory
    await saveConversation(
      from,
      to,
      msg,
      intent,
      shortReply,
      wantsVoice,
      "whatsapp"
    );
    await updateLastDisease(from, currentDisease);
    console.log("✅ Memory updated to:", currentDisease);

    // 4️⃣ Send reply via Twilio (voice or text)
    if (process.env.DRY_RUN === "true") {
      console.log("[WHATSAPP] DRY_RUN enabled. Message not sent.");
      console.log("[WHATSAPP] reply:", shortReply);
    } else {
      const sentMsg = await sendWhatsAppMessage(
        from,
        shortReply,
        wantsVoice,
        dialogData?.language
      );
      console.log("[WHATSAPP] sent:", {
        to: from,
        reply: shortReply,
        type: sentMsg.type,
        audioUrl: sentMsg.audioUrl,
        intent,
        sid: sentMsg.sid,
        aiResponseTime: `${aiResponseTime} ms`,
      });
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("[WHATSAPP] error:", err);

    // Attempt fallback text message to user
    if (process.env.DRY_RUN === "true") {
      console.log("[WHATSAPP] DRY_RUN enabled. Fallback SMS not sent.");
    } else {
      try {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: normalizeWhatsAppNumber(req.body?.From),
          body: "Sorry, I'm having trouble right now. Please try again later or consult a healthcare provider.",
        });
      } catch (_) {}
    }

    res.status(500).send("Server error");
  }
});

export default router;
