import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Cloud Firestore with auto-detect long polling for resilient connection on web/mobile
const configWithDb = firebaseConfig as typeof firebaseConfig & { firestoreDatabaseId?: string };
const databaseId = configWithDb.firestoreDatabaseId && configWithDb.firestoreDatabaseId !== '(default)'
  ? configWithDb.firestoreDatabaseId
  : undefined;

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, databaseId);
