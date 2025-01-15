// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import env from "@/env";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: env.VITE_API_KEY,
  authDomain: env.VITE_AUTH_DOMAIN,
  projectId: env.VITE_PROJECT_ID,
  storageBucket: env.VITE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_MESSAGING_SENDER_ID,
  appId: env.VITE_APP_ID,
  measurementId: env.VITE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
