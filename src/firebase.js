// src/firebase.js
// Replace these with your Firebase project config from the Firebase console

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyByxN1MhqL3XiKSJBsf4vZWW8K1I7x-F_k",
  authDomain: "tasks-fd5ab.firebaseapp.com",
  projectId: "tasks-fd5ab",
  storageBucket: "tasks-fd5ab.firebasestorage.app",
  messagingSenderId: "702340603046",
  appId: "1:702340603046:web:16ca3976b3fe4a710fa867",
  measurementId: "G-DMYXP2YJD3"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Initialize messaging (only in browser, not in service worker)
let messaging = null
if (typeof window !== 'undefined' && 'Notification' in window) {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.log('Messaging not supported:', error)
  }
}

export { messaging, getToken, onMessage }
export default app
