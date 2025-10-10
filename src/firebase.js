// Firebase initialization
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// TODO: Replace with your Firebase project config (from Firebase Console)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Ensure auth persists across refreshes in the browser
setPersistence(auth, browserLocalPersistence).catch(() => {})
// Force long polling to avoid WebChannel console errors in some environments
export const db = initializeFirestore(app, { experimentalForceLongPolling: true })
export const storage = getStorage(app)

export default app


