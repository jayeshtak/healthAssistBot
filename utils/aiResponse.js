// File: utils/aiResponse.js
// ============================
// Generates AI replies using Gemini for both fallback and normal scenarios
// ============================

import { buildGeminiPrompt, queryGemini } from "./ai.js";
import db from "../config/firebase.js"; // Firebase for logging AI response time

/**
 * Generate a short AI reply based on user message, intent, and topic.
 * Handles both fallback and normal responses automatically.
 * Logs AI response time to Firebase.
 *
 * @param {string} msg - User message
 * @param {string} intent - Detected intent
 * @param {string} topic - Current or previous disease/topic
 * @param {string} userId - User identifier (e.g., WhatsApp number)
 * @returns {Promise<string>} - AI-generated reply
 */
export async function generateReply(msg, intent, topic, userId = "unknown") {
  let reply = "";
  const startTime = Date.now();

  try {
    // Fallback AI prompt
    if (intent === "Default Fallback Intent" || intent === "Unknown") {
      const fallbackPrompt = buildGeminiPrompt(msg, intent, topic, true);
      reply = await queryGemini(fallbackPrompt);
    }

    // Normal AI prompt if fallback didn't produce anything
    if (!reply?.trim()) {
      const normalPrompt = buildGeminiPrompt(msg, intent, topic, false);
      reply = await queryGemini(normalPrompt);
    }

    return reply;
  } finally {
    // Log response time to Firebase
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    try {
      await db.ref(`aiLogs/${userId}/${Date.now()}`).set({
        message: msg,
        intent,
        topic,
        responseTimeMs,
      });
    } catch (err) {
      console.error("Failed to log AI response time:", err);
    }
  }
}
