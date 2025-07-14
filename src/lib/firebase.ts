
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
let auth;
let db;

// This check ensures we're in a browser environment and have a valid API key.
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  // Initialize Firebase only once
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Firebase initialization error", e);
    }
  } else {
    app = getApp();
  }

  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
    try {
      enableIndexedDbPersistence(db)
        .catch((err) => {
          if (err.code == 'failed-precondition') {
            console.warn("Firebase persistence failed due to multiple tabs.");
          } else if (err.code == 'unimplemented') {
            console.warn("Firebase persistence is not supported in this browser.");
          }
        });
    } catch(e) {
      console.warn("Firebase persistence could not be enabled.");
    }
  }
} else if (!firebaseConfig.apiKey) {
    console.error("Firebase API key is missing. Please check your environment variables.");
}

// Export the initialized services.
// Components should handle the possibility of these being null if initialization fails.
export { db, auth };
