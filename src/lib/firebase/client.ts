import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app"
import { connectAuthEmulator, getAuth } from "firebase/auth"
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore"

/**
 * Firebase web config.
 *
 * These values are inlined at build time and ship to the browser — that is by
 * design. The Firebase web API key is a project *identifier*, not a credential:
 * every access decision is made by firestore.rules, never by possession of this
 * key. See DESIGN.md and firestore.rules.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

if (!firebaseConfig.projectId) {
  throw new Error(
    "Firebase config is missing. Copy env.example to .env.local and fill it in."
  )
}

// getApps() guard: Turbopack re-executes modules on HMR, and initializeApp
// throws on a duplicate default app.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)

/**
 * Local development against `npm run emulators`, so the full submit → moderate
 * → publish loop can be exercised without touching the live project.
 * Start with: NEXT_PUBLIC_FIREBASE_USE_EMULATORS=true npm run dev
 */
if (
  process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "true" &&
  typeof window !== "undefined" &&
  !("_pulseEmulatorsConnected" in globalThis)
) {
  Object.assign(globalThis, { _pulseEmulatorsConnected: true })
  connectFirestoreEmulator(db, "127.0.0.1", 8080)
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
}
