/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Setup configuration using Vite's env variables, falling back to applet configuration JSON if absent
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Setting flag to true to indicate the availability/intent of real Firebase mode
export const useRealFirebase = true;

// Connection test validation helper according to Integration Skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Attempt fetching a dummy path from Firestore server to verify connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified and active!");
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.warn("Firestore connectivity test message:", error.message);
      if (error.message.includes('the client is offline')) {
        console.error("The Firestore client is offline. Please check your network and Firebase configuration.");
      }
    }
    return false;
  }
}

// Optionally trigger the test on initialization
testFirestoreConnection();

export { app, auth, db, googleProvider };
