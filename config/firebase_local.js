// File: config/firebase.js
// ============================
// Firebase configuration & helpers
// ============================

import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// Resolve current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Firebase service account key
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");

// Singleton database instance
let dbInstance = null;

/**
 * Initialize Firebase Realtime Database
 *
 * @param {string} dbUrl - Firebase Database URL
 * @returns {admin.database.Database} dbInstance
 */
export function initFirebase(dbUrl) {
  if (!dbUrl) {
    console.error("❌ FIREBASE_DB_URL missing!");
    process.exit(1);
  }

  if (!dbInstance) {
    // Initialize Firebase app
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      databaseURL: dbUrl,
    });

    dbInstance = admin.database();

    // Optional: confirm connection
    dbInstance.ref(".info/connected").on("value", (snap) => {
      if (snap.val() === true) {
        console.log("✅ Firebase connected successfully");
      }
    });
  }

  return dbInstance;
}

/**
 * Get a database reference
 *
 * @param {string} path - Path in the Firebase database
 * @returns {admin.database.Reference}
 */
export function getRef(path) {
  if (!dbInstance)
    throw new Error("Firebase not initialized. Call initFirebase() first.");
  return dbInstance.ref(path);
}

// Initialize Firebase with environment variable URL by default
export default initFirebase(process.env.FIREBASE_DB_URL);
