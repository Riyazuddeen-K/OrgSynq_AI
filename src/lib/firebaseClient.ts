import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth'

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[OrgSynq AI] Missing Firebase environment variables. ' +
      'Copy .env.example to .env and add your Firebase project config.'
  )
}

// A placeholder config lets the SDK initialize without throwing when env
// vars are missing. No network call happens until a hook actually queries
// Firestore, and every hook guards that behind isFirebaseConfigured.
const app = getApps().length
  ? getApps()[0]
  : initializeApp(
      isFirebaseConfigured
        ? firebaseConfig
        : { apiKey: 'demo-key', projectId: 'demo-project', appId: 'demo-app-id' }
    )

export const db = getFirestore(app)
export const auth = getAuth(app)

// Session-only persistence: signing in only stays valid for this browser
// tab/window's lifetime. Closing every tab (or the browser) clears it, so
// reopening the app requires signing in again — rather than Firebase's
// default of staying signed in indefinitely across restarts. signIn/signUp
// in AuthContext await this before authenticating, so it's guaranteed to
// be in effect before any session starts.
export const authReady: Promise<void> = isFirebaseConfigured
  ? setPersistence(auth, browserSessionPersistence).catch(() => undefined)
  : Promise.resolve()
