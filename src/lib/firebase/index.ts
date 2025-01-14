import { getAnalytics } from 'firebase/analytics'
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import env from '../env'

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const auth = getAuth(app)
export const db = getFirestore(app)

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  const user = result.user
  console.log('Successfully logged in with Google:', user)
}
