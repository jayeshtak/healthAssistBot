// File: config/dialogflow.js
// ============================
// Dialogflow configuration & helpers
// ============================

import dialogflow from "@google-cloud/dialogflow";
import path from "path";
import { fileURLToPath } from "url";

// Resolve current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Dialogflow service account key
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");

// Dialogflow project ID from environment variables
const projectId = process.env.DIALOGFLOW_PROJECT_ID;

// Validate project ID
if (!projectId) {
  console.error("❌ DIALOGFLOW_PROJECT_ID missing in .env file!");
  process.exit(1);
}

// Create Dialogflow session client
export const sessionClient = new dialogflow.SessionsClient({
  keyFilename: serviceAccountPath,
});

/**
 * Lightweight Hinglish detector (rule-based)
 * Returns true if at least 2 phonetic Hindi words are present in the text
 */
export function isHinglish(text) {
  const hinglishWords = [
    "kya",
    "nahi",
    "hai",
    "tum",
    "mera",
    "tere",
    "mujhe",
    "acha",
    "theek",
    "kyun",
    "kab",
    "kaise",
    "ky",
    "nhi",
    "bukhar",
    "dawa",
    "khana",
    "dard",
    "doctor",
    "bimar",
  ];

  const lower = text.toLowerCase();
  let count = 0;
  for (const w of hinglishWords) {
    if (lower.includes(w)) count++;
  }
  return count >= 2;
}

/**
 * Map Dialogflow language codes to full language names
 * Optionally override with Hinglish detection
 */
export function mapLanguageCodeToName(code, isHinglishFlag = false) {
  if (isHinglishFlag) return "Hinglish";

  const mapping = {
    hi: "Hindi",
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    gu: "Gujarati",
    mr: "Marathi",
  };

  return mapping[code] || "English";
}

/**
 * Detect intent and language using Dialogflow
 *
 * @param {string} text - User input text
 * @param {string} sessionId - Optional session ID for Dialogflow session
 * @returns {object} { intent, fulfillmentText, language }
 */
export async function detectIntentAndLanguage(text, sessionId = "default") {
  try {
    // Detect Hinglish manually
    const hinglish = isHinglish(text);

    // Create session path for Dialogflow
    const sessionPath = sessionClient.projectAgentSessionPath(
      projectId,
      sessionId
    );

    // Dialogflow text query request
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text,
          languageCode: "en-US", // Dialogflow handles Hinglish best as English
        },
      },
    };

    // Send request to Dialogflow
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    // Map language code to full name, consider Hinglish detection
    const langFull = mapLanguageCodeToName(result.languageCode, hinglish);

    return {
      intent: result.intent?.displayName || "Unknown",
      fulfillmentText: result.fulfillmentText || "",
      language: langFull,
    };
  } catch (error) {
    console.error("Dialogflow error:", error);
    return { intent: "Error", fulfillmentText: "", language: "English" };
  }
}
