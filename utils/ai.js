// File: utils/ai.js
// ============================
// AI helper functions for HealthAssist
// Includes Gemini API integration, medical query detection, disease extraction, and prompt building
// ============================

import fetch from "node-fetch";

// Gemini API endpoint for the default model (gemini-2.5-flash)
// API key is pulled from environment variables
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

/**
 * Low-level Gemini API request
 * Sends a text prompt to the Gemini model and returns the generated text.
 *
 * @param {string} prompt - The text prompt to send to Gemini.
 * @returns {Promise<string>} - The generated response text from Gemini.
 */
export async function queryGemini(prompt) {
  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await res.json();

    // If the API returned an error object, throw it
    if (data.error) {
      throw new Error(
        `Gemini API Error: ${data.error.code} - ${data.error.message}`
      );
    }

    // Return first candidate text or empty string if unavailable
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch (err) {
    console.error("[Gemini] API Error:", err.message);
    // Instead of returning "", propagate the error text
    return `⚠️ Gemini Error: ${err.message}`;
  }
}

/**
 * Determines if a query is health-related.
 * Uses Gemini to classify queries as medical or non-medical.
 *
 * @param {string} query - User input message.
 * @returns {Promise<boolean>} - True if query is health-related, otherwise false.
 */
export async function checkIfMedical(query) {
  const prompt = `Is this query health-related (disease, symptoms, medicine, first aid, vaccines)? Reply only "true" or "false".\n"${query}"`;
  const text = await queryGemini(prompt);

  // Return true if Gemini response includes "true" (case-insensitive)
  return text.toLowerCase().includes("true");
}

/**
 * Extracts the main disease or health condition from a given message.
 * Returns "unknown" if no clear disease is detected.
 *
 * @param {string} text - User message potentially containing disease info.
 * @returns {Promise<string>} - Extracted disease name or "unknown".
 */
export async function extractDisease(text) {
  const prompt = `Extract the main disease or health condition from the message below. Return ONLY the disease name. If none is clearly mentioned, return "unknown".\nMessage:\n"${text}"`;
  const result = await queryGemini(prompt);

  // Return "unknown" if response is empty or indicates unclear/unspecified info
  if (!result || /unknown|unclear|not mentioned|unspecified/i.test(result))
    return "unknown";

  return result;
}

/**
 * Generates a generic AI response for a given prompt.
 * Acts as a wrapper around `queryGemini` for general text generation.
 *
 * @param {string} prompt - Text prompt for AI response generation.
 * @returns {Promise<string>} - Generated AI response text.
 */
export async function generateAIResponse(prompt) {
  const text = await queryGemini(prompt);

  // Fallback message if Gemini fails to return anything
  return text || "Sorry, I couldn’t fetch that info right now.";
}

/**
 * Detects the language of a given text.
 * Uses Gemini to return the language name (e.g., English, Hindi, Tamil).
 *
 * @param {string} text - Text to detect language for.
 * @returns {Promise<string>} - Detected language name, or "Unknown" if detection fails.
 */
export async function detectLanguage(text) {
  const langPrompt = `Detect the language of this text and reply with only the language name (e.g. "English", "Hindi", "Tamil"): ${text}`;
  const detected = await queryGemini(langPrompt);

  // Return first line of Gemini response trimmed, or "Unknown" if empty
  return detected.split("\n")[0].trim() || "Unknown";
}

/**
 * Build a Gemini prompt for health assistant response.
 *
 * @param {string} msg - The user message
 * @param {string} intent - Detected intent from Dialogflow
 * @param {string} topicForAnswer - Current or previous disease/topic
 * @param {boolean} isFallback - True if Dialogflow fallback
 * @returns {string} - Formatted prompt for Gemini
 */
export function buildGeminiPrompt(
  msg,
  intent,
  topicForAnswer,
  isFallback = false
) {
  if (isFallback) {
    return `
You are a multilingual, concise health assistant.

Conversation context:
The recent topic is: ${topicForAnswer}

Rules:
- Words like "it", "its", "this", "isse", "iska" refer to the recent topic above.
- If the user message contains a disease name directly (for example: "adhd?", "diabetes", "asthma?"), ALWAYS give a brief definition of that disease.
- If the recent topic is unknown AND no disease name is mentioned, say information is unclear.

User message:
"${msg}"

Intent (context only):
${intent}

Your task:
1. Automatically detect the user's language and writing script.
2. Reply in the SAME language and SAME script.

STRICT language/script rules:
- English → English (Latin script)
- Hindi → Hindi (Devanagari script)
- Hinglish → Hinglish (Latin script only)
- Odia → Odia (Odia script only)

Response правила (must-follow):
- Do NOT translate the question
- Do NOT repeat or restate the question
- Do NOT add headings or titles
- Start directly with bullet points
- Always return at least one bullet point.
- Use dash (-) bullets ONLY
- Do NOT use #, *, _, parentheses, emojis, or markdown
- Keep under 80 words
- Be factual and concise
- If the information is unclear or unavailable, say so briefly in the SAME language
    `.trim();
  }

  // Normal prompt (not fallback)
  return `
You are a multilingual health assistant.

Conversation context:
The recent topic is: ${topicForAnswer}

Rules:
- Words like "it", "its", "this", "isse", "iska" refer to the recent topic above.
- If the user message contains a disease name directly (for example: "adhd?", "diabetes", "asthma?"), ALWAYS give a brief definition of that disease.
- If the recent topic is unknown AND no disease name is mentioned, say information is unclear.

User message:
"${msg}"

Task:
1. Automatically detect the user’s language and writing script.
2. Reply in the SAME language and SAME script.
3. STRICT rules:
   - If English → reply in English (Latin script)
   - If Hindi → reply in Hindi (Devanagari)
   - If Hinglish → reply in Hinglish (Latin script only)
   - If Odia → reply in Odia (Odia script only)

Response rules:
- Do NOT translate the question
- Do NOT repeat or restate the question
- Do NOT add headings or titles
- Start directly with bullet points
- Always return at least one bullet point.
- Use dash (-) for bullets only
- No numbering, emojis, markdown, or symbols
- Max 80 words
- Be factual and concise
- If information is uncertain, say so briefly

Intent (for context only): ${intent || "Unknown"}
  `.trim();
}
