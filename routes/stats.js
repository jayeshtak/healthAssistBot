// File: routes/stats.js
// ============================
// Advanced statistics endpoint for HealthAssist dashboard
// Computes totals, language/intent distributions, users by channel,
// WhatsApp voice vs text, last 24h messages, and average AI response time
// ============================

import express from "express";
import db from "../config/firebase.js";

const router = express.Router();

// 🔹 Utility: convert counts → percentages
const toPercentages = (obj, total) => {
  const percentages = {};
  for (const [key, count] of Object.entries(obj)) {
    percentages[key] = ((count / total) * 100).toFixed(1) + "%";
  }
  return percentages;
};

// 🔹 Fetch all conversations from Firebase
async function fetchConversations() {
  const snapshot = await db.ref("conversations").once("value");
  return snapshot.val() || {};
}

// 🔹 Fetch all AI logs
async function fetchAILogs() {
  const snapshot = await db.ref("aiLogs").once("value");
  return snapshot.val() || {};
}

// 🟢 GET /stats/advanced
router.get("/advanced", async (req, res) => {
  try {
    const conversations = await fetchConversations();
    const aiLogs = await fetchAILogs();

    // ---- Total messages ----
    const totalMessages = Object.keys(conversations).length;

    // ---- Language pie (ignore unknown) ----
    const langCount = {};
    Object.values(conversations).forEach((conv) => {
      const lang = conv.language || conv.reply?.language || "unknown";
      if (lang !== "unknown") langCount[lang] = (langCount[lang] || 0) + 1;
    });

    // ---- Intent pie (ignore Unknown & Default Fallback Intent) ----
    const intentCount = {};
    Object.values(conversations).forEach((conv) => {
      const intent = conv.intent || "Unknown";
      if (intent !== "Unknown" && intent !== "Default Fallback Intent") {
        intentCount[intent] = (intentCount[intent] || 0) + 1;
      }
    });

    // ---- Users by channel (WhatsApp vs SMS, ignore unknown & webhook) ----
    const usersByChannel = { whatsapp: new Set(), sms: new Set() };
    Object.values(conversations).forEach((conv) => {
      const src = conv.source?.toLowerCase();
      if (src === "whatsapp") usersByChannel.whatsapp.add(conv.from);
      if (src === "sms") usersByChannel.sms.add(conv.from);
    });

    const totalWhatsappUsers = usersByChannel.whatsapp.size;
    const totalSmsUsers = usersByChannel.sms.size;

    // ---- WhatsApp voice vs text ----
    const whatsappVoiceText = { voice: 0, text: 0 };
    Object.values(conversations).forEach((conv) => {
      if (conv.source?.toLowerCase() === "whatsapp") {
        const type = conv.reply?.type || "text";
        if (type === "voice") whatsappVoiceText.voice++;
        else whatsappVoiceText.text++;
      }
    });

    // ---- Messages in last 24 hours ----
    const now = Date.now();
    const last24hMessages = Object.values(conversations).filter(
      (conv) => now - conv.timestamp <= 24 * 60 * 60 * 1000
    ).length;

    // ---- Average AI response time ----
    let totalResponseTime = 0;
    let responseCount = 0;
    Object.values(aiLogs).forEach((userLogs) => {
      Object.values(userLogs).forEach((log) => {
        if (log.responseTimeMs) {
          totalResponseTime += log.responseTimeMs;
          responseCount++;
        }
      });
    });
    const avgResponseTimeMs = responseCount
      ? parseFloat((totalResponseTime / responseCount).toFixed(2))
      : 0;

    // ---- Return JSON ----
    res.json({
      totalMessages,
      languageDistribution: toPercentages(langCount, totalMessages),
      intentDistribution: toPercentages(intentCount, totalMessages),
      users: {
        whatsapp: totalWhatsappUsers,
        sms: totalSmsUsers,
      },
      whatsappVoiceText,
      last24hMessages,
      avgResponseTimeMs,
    });
  } catch (err) {
    console.error("📊 Advanced Stats Error:", err);
    res.status(500).json({ error: "Failed to fetch advanced stats" });
  }
});

export default router;
