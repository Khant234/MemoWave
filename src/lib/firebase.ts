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

// Check if all required environment variables are defined
const areAllConfigValuesDefined = Object.values(firebaseConfig).every(value => value);

// Initialize Firebase only if the configuration is complete
const app = !getApps().length && areAllConfigValuesDefined ? initializeApp(firebaseConfig) : (getApps().length > 0 ? getApp() : null);

// Conditionally export db and auth
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

if (app) {
  try {
    if (db) {
        enableIndexedDbPersistence(db)
          .catch((err) => {
            if (err.code == 'failed-precondition') {
              // This can happen if multiple tabs are open.
            } else if (err.code == 'unimplemented') {
              // This can happen if the browser doesn't support persistence.
            }
          });
    }
  } catch(e) {
    // This can happen if persistence is already enabled.
  }
}

export { db, auth };
