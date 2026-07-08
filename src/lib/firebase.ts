import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAHuci3RMs0KeRTDubOP6QPeCFAQdjr3Wg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'monsonglap.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'monsonglap',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'monsonglap.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '448473622545',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:448473622545:web:199c4e29392c36d2a169b0',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-R5XREN1PYN',
}

let app: FirebaseApp | null = null
let auth: Auth | null = null

function getFirebaseAuth(): Auth {
  if (!app) {
    app = initializeApp(firebaseConfig)
  }
  if (!auth) {
    auth = getAuth(app)
  }
  return auth
}

export async function signInWithGooglePopup(): Promise<{ idToken: string; credential: UserCredential }> {
  const firebaseAuth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  provider.addScope('profile')
  provider.addScope('email')

  const credential = await signInWithPopup(firebaseAuth, provider)
  const idToken = await credential.user.getIdToken()
  if (!idToken) {
    throw new Error('Missing Firebase ID token')
  }

  return { idToken, credential }
}

export async function signOutFirebase(): Promise<void> {
  if (!auth) return
  await signOut(auth)
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
}
