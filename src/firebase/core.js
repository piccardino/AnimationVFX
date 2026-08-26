// Firebase bootstrap, config storage and authentication API
import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Volley Hub Pro project defaults (overridable via .env / saved config)
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDVFrN-OOzEvzcsNrtYn_6HhIDF6dXtYJ4',
  authDomain: 'volley-hub-c90ca.firebaseapp.com',
  databaseURL: 'https://volley-hub-c90ca-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'volley-hub-c90ca',
  storageBucket: 'volley-hub-c90ca.firebasestorage.app',
  messagingSenderId: '614392919865',
  appId: '1:614392919865:web:f1273d14c2159b67089ae8',
  measurementId: 'G-457ZV7RM43',
};

const CONFIG_VERSION = 5;
const STORAGE_KEY = 'volley_firebase_config';

export function getStoredFirebaseConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.apiKey && saved.version === CONFIG_VERSION) return saved;
  } catch { /* corrupted entry falls through */ }
  return defaultFirebaseConfig;
}

export function saveStoredFirebaseConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, version: CONFIG_VERSION }));
}

export let app = null;
export let auth = null;
export let rtdb = null;

export function initFirebase(customConfig = null) {
  const cfg = customConfig || getStoredFirebaseConfig();
  try {
    if (!getApps().length) {
      app = initializeApp(cfg);
    } else {
      const existing = getApp();
      if (
        existing.options &&
        (existing.options.projectId !== cfg.projectId || existing.options.authDomain !== cfg.authDomain)
      ) {
        deleteApp(existing).catch(() => {});
        app = initializeApp(cfg);
      } else {
        app = existing;
      }
    }
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch((e) => console.warn('Persistence note:', e));
    rtdb = getDatabase(app);
  } catch (err) {
    console.warn('Firebase safe-init note:', err);
  }
  return { app, auth, rtdb };
}

initFirebase();

// Translate Firebase error codes into friendly Italian messages
function friendlyError(err) {
  const code = err?.code || '';
  const map = {
    'auth/email-already-in-use': 'Questa email è già registrata. Prova ad accedere.',
    'auth/invalid-email': 'Indirizzo email non valido.',
    'auth/user-not-found': 'Nessun account trovato con questa email.',
    'auth/wrong-password': 'Password errata. Riprova.',
    'auth/invalid-credential': 'Credenziali non valide. Controlla email e password.',
    'auth/weak-password': 'La password deve contenere almeno 6 caratteri.',
    'auth/too-many-requests': 'Troppi tentativi. Attendi qualche minuto.',
    'auth/popup-closed-by-user': 'Login annullato prima del completamento.',
    'auth/network-request-failed': 'Errore di rete: controlla la connessione.',
    'auth/operation-not-allowed': 'Metodo di accesso non abilitato sulla console Firebase.',
  };
  if (code && map[code]) return map[code];
  const raw = `${code} ${err?.message || err}`.toLowerCase();
  if (raw.includes('api key not valid') || raw.includes('invalid-api-key')) {
    return 'API key Firebase non valida: controlla la configurazione nel modal di login.';
  }
  if (raw.includes('database is closing') || raw.includes('hidden')) {
    return 'Accesso interrotto perché la pagina è stata nascosta dal browser. Riprova.';
  }
  return err?.message || String(err || 'Errore sconosciuto');
}

export async function loginWithEmail(email, password) {
  if (!auth) initFirebase();
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { user: cred.user, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err) };
  }
}

export async function registerWithEmail(email, password) {
  if (!auth) initFirebase();
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return { user: cred.user, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err) };
  }
}

export async function loginWithGoogle() {
  if (!auth) initFirebase();
  if (!auth) return { user: null, error: 'Firebase Auth non inizializzato.' };
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const cred = await signInWithPopup(auth, provider);
    return { user: cred.user, error: null };
  } catch (popupErr) {
    console.warn('Google popup failed, trying redirect:', popupErr);
    try {
      await signInWithRedirect(auth, provider);
      return { user: null, error: null }; // page will reload after redirect
    } catch (redirectErr) {
      return { user: null, error: friendlyError(redirectErr) };
    }
  }
}

export async function completeGoogleSignIn() {
  if (!auth) initFirebase();
  if (!auth) return { user: null, error: null };
  try {
    const res = await getRedirectResult(auth);
    return res?.user ? { user: res.user, error: null } : { user: null, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err) };
  }
}

export async function logout() {
  if (!auth) return { error: null };
  try {
    await signOut(auth);
    return { error: null };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

export function subscribeToAuth(callback) {
  if (!auth) initFirebase();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (user) => callback(user));
}
