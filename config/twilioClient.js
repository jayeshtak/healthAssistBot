// File: config/twilioClient.js
// ============================
// Twilio client configuration
// ============================

import twilio from "twilio";

// Create a singleton Twilio client using environment variables
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
