import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Cloud Firestore using the configured database ID if present
const configWithDb = firebaseConfig as typeof firebaseConfig & { firestoreDatabaseId?: string };
export const db = configWithDb.firestoreDatabaseId && configWithDb.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, configWithDb.firestoreDatabaseId)
  : getFirestore(app);

