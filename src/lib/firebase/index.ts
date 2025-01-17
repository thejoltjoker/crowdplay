import { getAnalytics } from "firebase/analytics";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

import env from "@/env";

import firebaseJson from "../../../firebase.json";

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
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

if (import.meta.env.DEV) {
  connectFirestoreEmulator(
    db,
    "127.0.0.1",
    firebaseJson.emulators.firestore.port ?? 8080,
  );

  connectAuthEmulator(
    auth,
    `http://127.0.0.1:${firebaseJson.emulators.auth.port ?? 9099}`,
    { disableWarnings: true },
  );

  connectFunctionsEmulator(
    functions,
    "127.0.0.1",
    firebaseJson.emulators.functions.port ?? 5001,
  );
}
