// File: utils/preprocess.js
// ============================
// Preprocessing utilities for WhatsApp messages
// ============================

/**
 * Normalize WhatsApp number to standard format
 * Example: "whatsapp:+1234567890"
 *
 * @param {string} number - Raw WhatsApp number
 * @returns {string} - Normalized WhatsApp number
 */
export function normalizeWhatsAppNumber(number) {
  if (!number) return "";
  let num = number.replace(/^whatsapp:/, "");
  num = num.replace(/\D+/g, "");
  return `whatsapp:+${num}`;
}

/**
 * Clean text for text-to-speech (TTS) processing
 *
 * @param {string} text - Input message
 * @returns {string} - Sanitized text
 */
export function sanitizeForTTS(text) {
  if (!text) return "";
  return text
    .replace(/^- /gm, "\n") // Replace starting dashes with newline
    .replace(/[^\p{L}\p{N}\s.,?!]/gu, "") // Keep letters, numbers, punctuation
    .replace(/[\r\n]{2,}/g, "\n") // Merge multiple line breaks
    .replace(/\s{2,}/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Detect if the user wants a voice response based on keywords
 *
 * @param {string} msg - Incoming user message
 * @returns {Object} - { cleanedText: string, wantsVoice: boolean }
 */
export function detectVoiceRequest(msg) {
  const voiceKeywords = /voice|audio|bol ke|bolo|awaaz|sunao|सुनाओ|🔊|🎤/i;
  let wantsVoice = false;
  let cleanedText = msg || "";

  if (voiceKeywords.test(cleanedText)) {
    wantsVoice = true;
    cleanedText = cleanedText.replace(voiceKeywords, "").trim();
  }

  return { cleanedText, wantsVoice };
}
