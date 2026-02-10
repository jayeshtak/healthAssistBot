// File: config/firebase.js
// ============================
// Firebase configuration & helpers (ENV-based for cloud)
// ============================

import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

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
  console.warn("⚠️ Firebase disabled (no DB URL)");
  return null;
}


  if (!dbInstance) {
    // ✅ Initialize Firebase using ENV credentials (NO JSON FILE)
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
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
  if (!dbInstance) {
    throw new Error("Firebase not initialized. Call initFirebase() first.");
  }
  return dbInstance.ref(path);
}

// ✅ Initialize Firebase on import using ENV URL
//export default initFirebase(process.env.FIREBASE_DB_URL);


// ✅ dummy db export
const db = null;
export default db;