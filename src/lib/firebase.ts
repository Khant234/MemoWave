
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

// A function to initialize Firebase if it hasn't been already.
const initializeFirebase = () => {
  const areAllConfigValuesDefined = Object.values(firebaseConfig).every(value => value);
  if (!areAllConfigValuesDefined) {
    console.error("Firebase config is missing one or more values. Check your .env file.");
    // Return null or throw an error, depending on how you want to handle missing config
    return null;
  }
  
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
};

const app = initializeFirebase();

const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

if (app && db) {
  try {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // This can happen if multiple tabs are open.
          console.warn("Firebase persistence failed due to multiple tabs.");
        } else if (err.code == 'unimplemented') {
          // This can happen if the browser doesn't support persistence.
          console.warn("Firebase persistence is not supported in this browser.");
        }
      });
  } catch(e) {
    // This can happen if persistence is already enabled.
    console.warn("Firebase persistence already enabled.");
  }
}

// Export the initialized services.
// Components should handle the possibility of these being null if initialization fails.
export { db, auth };
