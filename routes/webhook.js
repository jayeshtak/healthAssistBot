// File: routes/webhook.js
// ============================
// Webhook route for Dialogflow / AI responses
// Handles incoming requests from Dialogflow or other chat platforms
// Logs conversations and AI response time to Firebase
// ============================

import express from "express";
import db from "../config/firebase.js";
import {
  generateAIResponse,
  detectLanguage,
  checkIfMedical,
  extractDisease,
} from "../utils/ai.js";

const router = express.Router();

// POST /webhook
router.post("/", async (req, res) => {
  try {
    // Extract user query and intent
    const queryText = req.body.queryResult?.queryText || "Hello!";
    const intentName = req.body.queryResult?.intent?.displayName || "Unknown";

    console.log(`🤖 Intent: ${intentName} | User: ${queryText}`);

    // Detect language
    const detectedLang = await detectLanguage(queryText);
    console.log(`🌐 Detected Language: ${detectedLang}`);

    // Check if query is health-related
    const isMedical = await checkIfMedical(queryText);
    if (!isMedical) {
      return res.json({
        fulfillmentText:
          "⚕️ I'm HealthAssist — I can only answer health and medical awareness questions. Try asking about symptoms, diseases, prevention, or vaccines.",
      });
    }

    // Extract disease for logging and topic purposes
    const currentDisease = await extractDisease(queryText);
    const topicForAnswer = currentDisease || "unknown";

    // Generate AI response and measure time
    const aiStartTime = performance.now();
    let answer = "";

    switch (intentName) {
      case "Disease Info":
        answer = await generateAIResponse(
          `Provide short, clear information about: ${queryText}. Respond in ${detectedLang} language.`
        );
        break;

      case "Prevention Tips":
        answer = await generateAIResponse(
          `Give prevention and lifestyle tips for: ${queryText}. Respond in ${detectedLang} language.`
        );
        break;

      case "Vaccine Check":
        answer = await generateAIResponse(
          `Provide vaccination or awareness info for: ${queryText}. Respond in ${detectedLang} language.`
        );
        break;

      case "Symptom Checker":
        answer = await generateAIResponse(
          `User said: "${queryText}". They might be describing symptoms.
           Suggest general possible causes (not diagnosis) and mention when to see a doctor.
           Respond in ${detectedLang} language.`
        );
        break;

      case "Default Welcome Intent":
        answer =
          "👋 Hi! I'm HealthAssist — your AI health awareness assistant. Ask me about diseases, vaccines, symptoms, or prevention tips.";
        break;

      default:
        answer =
          "Sorry, I’m still learning about that topic. Please ask about health, symptoms, or diseases.";
    }

    const aiEndTime = performance.now();
    const responseTimeMs = parseFloat((aiEndTime - aiStartTime).toFixed(2));
    console.log(`⏱️ AI response time: ${responseTimeMs} ms`);

    // Log AI response time consistently
    try {
      await db.ref(`aiLogs/Webhook/${Date.now()}`).set({
        message: queryText,
        intent: intentName,
        language: detectedLang,
        topic: topicForAnswer,
        channel: "Webhook",
        responseTimeMs,
      });
    } catch (err) {
      console.error("[WEBHOOK] Failed to log AI response time:", err);
    }

    // Log conversation in Firebase
    await db.ref("conversations").push({
      query: queryText,
      intent: intentName,
      language: detectedLang,
      topic: topicForAnswer,
      answer,
      channel: "Webhook",
      timestamp: Date.now(),
    });

    // Return response to Dialogflow
    res.json({ fulfillmentText: answer });
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    res.status(500).json({ fulfillmentText: "Error processing your request." });
  }
});

export default router;
