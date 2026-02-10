// File: utils/medicalCheck.js
// ============================
// Handle non-medical queries by checking and sending a predefined response
// ============================

import { checkIfMedical } from "./ai.js";
import { twilioClient } from "../config/twilioClient.js"; // Centralized Twilio client

/**
 * Check if a message is health-related and respond if not.
 *
 * @param {string} from - Sender WhatsApp number
 * @param {string} msg - User message
 * @returns {Promise<boolean>} - Returns true if medical, false otherwise
 */
export async function handleNonMedical(from, msg) {
  // Use AI to determine if message is medical
  const isMedical = await checkIfMedical(msg);
  if (isMedical) return true;

  // If not medical, send default response via WhatsApp
  const reply =
    "- I am a health assistant and cannot answer non-medical questions.";
  const sent = await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: from,
    body: reply,
  });

  console.log("[WHATSAPP] sent (non-medical):", {
    to: from,
    reply,
    sid: sent.sid,
  });

  return false;
}
