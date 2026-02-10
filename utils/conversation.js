// File: utils/conversation.js
// ============================
// Firebase helpers to save conversations and track user last disease
// ============================

import db from "../config/firebase.js";

/**
 * Save a conversation entry to Firebase Realtime Database.
 *
 * @param {string} from - Sender number
 * @param {string} to - Receiver number
 * @param {string} msg - User message
 * @param {string} intent - Detected intent
 * @param {string} replyText - AI-generated reply
 * @param {boolean} wantsVoice - Indicates if the reply should be voice
 * @param {string} source - "whatsapp" or "sms"
 * @returns {Promise<string>} - Returns the Firebase conversation key
 */
export async function saveConversation(
  from,
  to,
  msg,
  intent,
  replyText,
  wantsVoice,
  source = "unknown"
) {
  const convoRef = db.ref("conversations").push();

  await convoRef.set({
    source, // now uses parameter
    from,
    to,
    query: msg,
    intent,
    reply: {
      fullAnswer: replyText,
      type: wantsVoice ? "voice" : "text",
      source: "gemini_auto",
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
  });

  return convoRef.key;
}

/**
 * Update the user's last disease/topic in memory for context in future messages.
 *
 * @param {string} userId - User number (used as unique identifier)
 * @param {string} disease - Detected disease/topic from the current message
 */
export async function updateLastDisease(userId, disease) {
  if (disease && disease !== "unknown") {
    await db.ref(`users/${userId}/lastDisease`).set(disease);
  }
}
