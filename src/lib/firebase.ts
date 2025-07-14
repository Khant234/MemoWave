
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
let auth: Auth;
let db: Firestore;

function initializeFirebase() {
  if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        enableIndexedDbPersistence(db).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn("Firebase persistence failed due to multiple tabs.");
          } else if (err.code === 'unimplemented') {
            console.warn("Firebase persistence is not supported in this browser.");
          }
        });
        
      } catch (e) {
        console.error("Firebase initialization error", e);
      }
    } else {
      app = getApp();
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } else if (!firebaseConfig.apiKey) {
    console.error("Firebase API key is missing. Please check your environment variables.");
  }
}

// Call initialization
initializeFirebase();

// Export getters to ensure initialization has occurred
export const getDb = () => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

export const getAuthInstance = () => {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
};
