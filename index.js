// File: index.js
// ============================
// Main server entry point
// Initializes Express server, middleware, and routes
// ============================

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// ============================
// Route Handlers
// ============================

// Dialogflow / generic webhook route
import webhookRoute from "./routes/webhook.js";

// Stats & analytics route
import statsRoute from "./routes/stats.js";

// WhatsApp (Twilio) webhook route
import whatsappRoute from "./config/whatsapp.js";

// SMS (Twilio) webhook route
import smsRoute from "./routes/sms.js";

// ============================
// Environment Configuration
// ============================

// Load environment variables from .env file
dotenv.config();

// ============================
// Express App Initialization
// ============================

const app = express();

// ============================
// Global Middleware
// ============================

// Enable Cross-Origin Resource Sharing
// Allows frontend or external services to access APIs
app.use(cors());

// Parse incoming JSON payloads
app.use(express.json());

// Parse URL-encoded data
// Required for Twilio WhatsApp webhooks and form submissions
app.use(express.urlencoded({ extended: true }));

// ============================
// Routes
// ============================

// Root route (basic server health check)
app.get("/", (req, res) => {
  res.send("✅ HealthAssist Node server running with Gemini 2.5 API!");
});

// Webhook route (Dialogflow / AI platforms)
app.use("/webhook", webhookRoute);

// Stats route (analytics, logs, monitoring)
app.use("/stats", statsRoute);

// WhatsApp webhook route (Twilio WhatsApp integration)
app.use("/whatsapp", whatsappRoute);

// SMS webhook route (Twilio SMS integration)
app.use("/sms", smsRoute);

// ============================
// Start Server
// ============================

const PORT = process.env.PORT || 8080;

export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 HealthAssist running on port ${PORT}`);
  });
}
