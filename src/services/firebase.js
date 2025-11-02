// ---------------------------
// File: src/services/firebase.js

// (kept same as you provided; included here for completeness)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);




// ---------------------------
// Notes / instructions:
// - The dashboard now loads `maintenance` and `notes` from the user's Firestore document (collection: "users", doc: uid).
// - Maintenance Save updates the user's document (fields: maintenance, name, room, roommates) so the data persists across reloads.
// - Notes are saved under a `notes` object in the user doc (keys: YYYY-MM-DD) and the calendar highlights dates with notes using a light green circular style.
// - Date formatting uses local timezone via toLocaleDateString('en-CA') to avoid off-by-one UTC problems.
// - You don't need any new Firestore collections for maintenance/notes; they live inside the user doc. Complaints continue to be stored in the `complaints` collection.
// - If you prefer a different storage layout (e.g. a separate `maintenance` collection), tell me and I will change it.

// How to integrate:
// 1) Replace your current ResidentDashboard.jsx with the file above.
// 2) Keep your firebase.js as-is (included above for convenience).
// 3) Make sure your Firestore rules allow the authenticated user to update their own document.
// 4) Test: sign in, open Maintenance modal, save — reload page and the values should persist. Open Duty Calendar, add a note, save — the date should now be highlighted.

// If you want me to also add a small UI to bulk-import/export notes or show a list of upcoming duties, I can add that next.
