// Firebase initialization
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// TODO: Replace with your Firebase project config (from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyAG1_zy1po1TEbsTKw5tCKNIAfUw9NEq0A",
    authDomain: "cloud-storage-eab72.firebaseapp.com",
    projectId: "cloud-storage-eab72",
    storageBucket: "cloud-storage-eab72.firebasestorage.app",
    messagingSenderId: "486774340784",
    appId: "1:486774340784:web:0c20905f33b4ed590acf75",
    measurementId: "G-FVPJ4JEP7J"
  };

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Ensure auth persists across refreshes in the browser
setPersistence(auth, browserLocalPersistence).catch(() => {})
// Force long polling to avoid WebChannel console errors in some environments
export const db = initializeFirestore(app, { experimentalForceLongPolling: true })
export const storage = getStorage(app)

export default app


