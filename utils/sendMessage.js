// File: utils/sendMessage.js
// ============================
// Send messages via WhatsApp (text or voice) using Twilio
// ============================

import { textToSpeechAndUpload } from "./tts.js";
import { sanitizeForTTS } from "./preprocess.js";
import { twilioClient } from "../config/twilioClient.js";
import fs from "fs";

/**
 * Send a message via WhatsApp (text or voice)
 *
 * @param {string} to - Recipient WhatsApp number (normalized)
 * @param {string} text - Message text to send
 * @param {boolean} wantsVoice - If true, send as voice message
 * @param {string} userLang - Language code for TTS (e.g., "en", "hi", "or")
 * @returns {Promise<Object>} - { type: "text"|"audio", sid: string, audioUrl?: string }
 */
export async function sendWhatsAppMessage(
  to,
  text,
  wantsVoice = false,
  userLang = "en"
) {
  if (wantsVoice) {
    let tempAudioFile = null;

    try {
      // Determine TTS language
      let ttsLang = "en";
      if (userLang.startsWith("hi")) ttsLang = "hi";
      else if (userLang.startsWith("or")) ttsLang = "or";

      // Sanitize text for TTS
      const sanitizedText = sanitizeForTTS(text);

      // Generate audio and upload
      tempAudioFile = await textToSpeechAndUpload(sanitizedText, ttsLang, {
        format: "ogg",
        codec: "opus",
        contentType: "audio/ogg",
      });

      if (!tempAudioFile) throw new Error("Audio upload returned empty URL");

      // Send voice message via Twilio WhatsApp
      const sent = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to,
        mediaUrl: [tempAudioFile],
      });

      return { type: "audio", audioUrl: tempAudioFile, sid: sent.sid };
    } catch (err) {
      console.error("🔊 Voice failed, fallback to text:", err);

      // Fallback to text message if TTS fails
      const sent = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to,
        body: text,
      });

      return { type: "text", sid: sent.sid };
    } finally {
      // Cleanup temp audio files if any
      if (tempAudioFile) {
        try {
          if (fs.existsSync(tempAudioFile)) fs.unlinkSync(tempAudioFile);
        } catch (err) {
          console.error(
            "Failed to delete temp audio file:",
            tempAudioFile,
            err
          );
        }
      }
    }
  } else {
    // Send plain text message
    const sent = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to,
      body: text,
    });
    return { type: "text", sid: sent.sid };
  }
}
