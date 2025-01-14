// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqWvmfMNCJcW80CqvCXV8lPRnFxEQDego",
  authDomain: "crowdplay-e207f.firebaseapp.com",
  projectId: "crowdplay-e207f",
  storageBucket: "crowdplay-e207f.firebasestorage.app",
  messagingSenderId: "167339284503",
  appId: "1:167339284503:web:820a3fe0e0f817e43b2452",
  measurementId: "G-TGVVHSS2YY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);