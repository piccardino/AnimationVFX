import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  get,
  child,
  set,
  onValue
} from 'firebase/database';

// Configured through the Firebase console for Volley Hub Pro (volley-hub-c90ca)
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDVFrN-OOzEvzcsNrtYn_6HhIDF6dXtYJ4",
  authDomain: "volley-hub-c90ca.firebaseapp.com",
  databaseURL: "https://volley-hub-c90ca-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "volley-hub-c90ca",
  storageBucket: "volley-hub-c90ca.firebasestorage.app",
  messagingSenderId: "614392919865",
  appId: "1:614392919865:web:f1273d14c2159b67089ae8",
  measurementId: "G-457ZV7RM43"
};

// Bump this whenever defaultFirebaseConfig changes so that a stale config in localStorage is cleared.
const FIREBASE_CONFIG_VERSION = 4;

export function getStoredFirebaseConfig() {
  const saved = localStorage.getItem('volley_firebase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.version === FIREBASE_CONFIG_VERSION) return parsed;
    } catch (e) {
      console.error('Error parsing stored firebase config:', e);
    }
  }
  return defaultFirebaseConfig;
}

export function saveStoredFirebaseConfig(config) {
  localStorage.setItem('volley_firebase_config', JSON.stringify({ ...config, version: FIREBASE_CONFIG_VERSION }));
}

let app = null;
let auth = null;
let rtdb = null;

export function initFirebase(customConfig = null) {
  const configToUse = customConfig || getStoredFirebaseConfig();
  
  try {
    if (!getApps().length) {
      app = initializeApp(configToUse);
    } else {
      const existing = getApp();
      if (existing.options && (existing.options.projectId !== configToUse.projectId || existing.options.authDomain !== configToUse.authDomain)) {
        deleteApp(existing).catch(() => {});
        app = initializeApp(configToUse);
      } else {
        app = existing;
      }
    }
    
    if (app) {
      auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence).catch((e) => console.warn('Persistence note:', e));
      rtdb = getDatabase(app);
    }
  } catch (err) {
    console.warn('Firebase safe init note:', err);
  }
  
  return { app, auth, rtdb };
}

// Initial setup
initFirebase();

// Complete any pending Google redirect sign-in
completeGoogleSignIn().then((res) => {
  if (res && res.error) {
    console.error('[Firebase] Pending Google sign-in could not be completed:', res.error);
  }
});

export { auth, rtdb };

function friendlyError(err) {
  const code = (err && err.code) || '';
  const raw = (err && err.message) || String(err || 'Unknown error');
  const t = `${code} ${raw}`.toLowerCase();

  if (t.includes('database is closing/hidden')) {
    return 'Sign-in was interrupted: the browser hid this page (popup focus) so Firebase could not save the session. We now redirect instead of using a popup, so try again.';
  }
  if (t.includes('invalid-api-key') || t.includes('api key not valid') || t.includes('api key invalid')) {
    return 'Firebase rejected the API key. Recreate it in Google Cloud Console (APIs & Services > Credentials), then update the app key (VITE_FIREBASE_API_KEY) and redeploy.';
  }
  if (t.includes('accessnotconfigured') || t.includes('identity toolkit api')) {
    return 'The Identity Toolkit API is disabled for this project. Enable it in Google Cloud Console under APIs & Services.';
  }
  if (t.includes('app-check')) {
    return 'Firebase App Check is blocking this sign-in. Disable App Check enforcement or initialize App Check in the app.';
  }
  if (t.includes('unauthorized-domain') || t.includes('not authorized') || t.includes('not allowlisted')) {
    return 'This domain is not allowed for Firebase sign-in. Add it under Firebase Console > Authentication > Settings > Authorized domains.';
  }
  if (t.includes('popup-closed')) {
    return 'The sign-in popup was closed before finishing. Try again.';
  }
  if (t.includes('network-request-failed') || t.includes('network error') || t.includes('fetching') && t.includes('config')) {
    return 'Network error while contacting Firebase. Check your connection and try again.';
  }
  if (t.includes('user-not-found') || t.includes('invalid-login-credentials') || t.includes('wrong-password') || t.includes('invalid-credential')) {
    return 'Wrong email or password.';
  }
  if (t.includes('email-already-in-use')) {
    return 'An account already exists for this email. Sign in instead.';
  }
  if (t.includes('weak-password')) {
    return 'Password is too weak (minimum 6 characters).';
  }
  if (t.includes('too-many-requests')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (t.includes('operation-not-allowed')) {
    return 'This sign-in method is not enabled in Firebase Console > Authentication.';
  }
  if (code) return `${raw} (${code})`;
  return raw;
}

export async function loginWithEmail(email, password) {
  if (!auth) initFirebase();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err) };
  }
}

export async function registerWithEmail(email, password, name = '', username = '') {
  if (!auth) initFirebase();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (rtdb && user) {
      try {
        await set(ref(rtdb, `users/${user.uid}/profile`), {
          name: name || email.split('@')[0],
          username: username || email.split('@')[0],
          email: email
        });
      } catch (e) {
        console.warn('Profile save note:', e);
      }
    }

    return { user, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err) };
  }
}

export async function loginWithGoogle() {
  if (!auth) initFirebase();
  try {
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err) };
  }
}

export async function completeGoogleSignIn() {
  if (!auth) initFirebase();
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await getRedirectResult(auth);
    return { user: result ? result.user : null, error: null };
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
    return { error: err.message };
  }
}

export function subscribeToAuth(callback) {
  if (!auth) initFirebase();
  if (!auth) return () => {};
  try {
    return onAuthStateChanged(auth, callback);
  } catch (e) {
    return () => {};
  }
}

// Helper utilities for roster and role parsing
function parsePlayersFromJson(playersData) {
  if (!playersData) return [];
  let list = [];
  if (Array.isArray(playersData)) {
    list = playersData;
  } else if (typeof playersData === 'object') {
    list = Object.values(playersData);
  }
  return list.filter(p => p && typeof p === 'object' && p.name).map((p, idx) => ({
    id: p.id || 'p_' + idx,
    name: String(p.name).trim().toUpperCase(),
    number: p.number ? String(p.number) : String(idx + 1),
    role: normalizeRole(p.role),
    team: p.team || null,
    active: p.active !== false
  }));
}

function normalizeRole(role) {
  if (!role) return 'OUTSIDE HITTER';
  const r = String(role).trim();
  const lower = r.toLowerCase();

  if (lower.includes('palleggi') || lower.includes('setter') || r === 'P') return 'SETTER';
  if (lower.includes('central') || lower.includes('middle') || r === 'C' || r === 'MB') return 'MIDDLE BLOCKER';
  if (lower.includes('schiaccia') || lower.includes('outside') || lower.includes('banda') || r === 'S' || r === 'OH') return 'OUTSIDE HITTER';
  if (lower.includes('oppost') || lower.includes('opposite') || r === 'O' || r === 'OPP') return 'OPPOSITE';
  if (lower.includes('libero') || r === 'L') return 'LIBERO';
  if (lower.includes('univ') || r === 'U') return 'UNIVERSAL';

  return r.toUpperCase();
}

function matchPlayerInRoster(name, roster) {
  if (!name || !Array.isArray(roster)) return null;
  const target = String(name).trim().toUpperCase();
  return roster.find(p => p.name && (p.name.toUpperCase() === target || p.name.toUpperCase().includes(target) || target.includes(p.name.toUpperCase())));
}

function deriveTeamNames(players, defaultA = 'VPM', defaultB = 'VHP') {
  if (!Array.isArray(players) || players.length === 0) return { teamA: defaultA, teamB: defaultB };
  const teams = Array.from(new Set(players.map(p => p.team).filter(Boolean)));
  return {
    teamA: teams[0] ? String(teams[0]).toUpperCase() : defaultA,
    teamB: teams[1] ? String(teams[1]).toUpperCase() : defaultB
  };
}

function normalizePlayerTeam(teamVal, teamNameA, teamNameB, defaultTeam) {
  if (!teamVal) return defaultTeam;
  const t = String(teamVal).trim().toUpperCase();
  if (t === 'TEAM-A' || t === 'TEAM_A' || t === 'A' || t === '1' || t === teamNameA) return teamNameA;
  if (t === 'TEAM-B' || t === 'TEAM_B' || t === 'B' || t === '2' || t === teamNameB) return teamNameB;
  return t;
}

// Helper to process user data node (formation + players roster)
function processUserRosterAndFormation(uData) {
  if (!uData || typeof uData !== 'object') return null;

  let teamNameA = 'VPM';
  let teamNameB = 'VHP';

  const fData = uData.matchData && uData.matchData.formation;
  if (fData) {
    if (fData.benchA && String(fData.benchA).trim()) teamNameA = String(fData.benchA).trim().toUpperCase();
    if (fData.benchB && String(fData.benchB).trim()) teamNameB = String(fData.benchB).trim().toUpperCase();
  }

  const rawRoster = uData.players ? parsePlayersFromJson(uData.players) : [];
  const activeFormationPlayers = [];

  if (fData && fData.tokens && Array.isArray(fData.tokens)) {
    fData.tokens.forEach((t, idx) => {
      if (t && t.name) {
        const matched = matchPlayerInRoster(t.name, rawRoster);
        const isTeamA = (t.team === 'team-a' || t.team === 'A' || t.team === 'TEAM-A' || String(t.team).toUpperCase() === teamNameA);
        const teamCode = isTeamA ? teamNameA : teamNameB;

        let resolvedRole = 'OUTSIDE HITTER';
        if (matched && matched.role) {
          resolvedRole = normalizeRole(matched.role);
        } else if (t.role && t.role !== 'Universal') {
          resolvedRole = normalizeRole(t.role);
        } else if (t.role === 'Libero') {
          resolvedRole = 'LIBERO';
        }

        activeFormationPlayers.push({
          id: matched ? matched.id : 'token_' + idx,
          name: matched ? matched.name : String(t.name).toUpperCase(),
          number: matched ? matched.number : String(idx + 1),
          role: resolvedRole,
          team: teamCode,
          active: true
        });
      }
    });
  }

  // Include remaining roster players not in formation, assigning team if missing
  if (rawRoster.length > 0) {
    rawRoster.forEach((r, idx) => {
      if (!activeFormationPlayers.some(ap => ap.name === r.name)) {
        const defaultTeam = idx % 2 === 0 ? teamNameA : teamNameB;
        const assignedTeam = normalizePlayerTeam(r.team, teamNameA, teamNameB, defaultTeam);
        activeFormationPlayers.push({
          ...r,
          team: assignedTeam
        });
      }
    });
  }

  if (activeFormationPlayers.length > 0) {
    return { players: activeFormationPlayers, teamA: teamNameA, teamB: teamNameB };
  }
  return null;
}

// Helper to search across user nodes for matching email/username or node with most roster players
function findBestUserNodeInUsers(usersObj, targetEmail = null, targetUserId = null) {
  if (!usersObj || typeof usersObj !== 'object') return null;

  const emailClean = targetEmail ? String(targetEmail).trim().toLowerCase() : '';
  const emailPrefix = emailClean ? emailClean.split('@')[0] : '';

  let exactMatch = null;
  let prefixMatch = null;
  let maxPlayerMatch = null;
  let maxPlayerCount = -1;

  for (const uid of Object.keys(usersObj)) {
    const uData = usersObj[uid];
    if (!uData || typeof uData !== 'object') continue;

    const res = processUserRosterAndFormation(uData);
    if (!res || !res.players || res.players.length === 0) continue;

    const profEmail = String(uData.profile?.email || '').trim().toLowerCase();
    const profName = String(uData.profile?.name || uData.profile?.username || '').trim().toLowerCase();

    // Exact UID match with valid players
    if (targetUserId && uid === targetUserId) {
      return res;
    }

    // Exact email match
    if (emailClean && profEmail === emailClean) {
      exactMatch = res;
    }

    // Username / Email prefix match (e.g. "zeuspiccardinoo")
    if (emailPrefix && (profEmail.includes(emailPrefix) || profName.includes(emailPrefix) || emailPrefix.includes(profName))) {
      prefixMatch = res;
    }

    // Track user node with most players
    if (res.players.length > maxPlayerCount) {
      maxPlayerCount = res.players.length;
      maxPlayerMatch = res;
    }
  }

  return exactMatch || prefixMatch || maxPlayerMatch;
}

// Fetch active match formation & roster from Realtime DB (one-time fetch)
export async function fetchPlayersFromFirebase(userId = null, userEmail = null) {
  if (!rtdb) initFirebase();

  // 1. Try fetching logged-in user's custom node by userId
  if (userId && rtdb) {
    try {
      const userSnap = await get(child(ref(rtdb), `users/${userId}`));
      if (userSnap.exists()) {
        const res = processUserRosterAndFormation(userSnap.val());
        if (res && res.players.length > 0) {
          return { ...res, error: null };
        }
      }
    } catch (e) {
      console.warn('User RTDB fetch warning:', e);
    }
  }

  // 2. Scan all user accounts in 'users' matching user's email/username or node with most roster players
  if (rtdb) {
    try {
      const usersSnap = await get(child(ref(rtdb), 'users'));
      if (usersSnap.exists()) {
        const usersObj = usersSnap.val();
        const bestRes = findBestUserNodeInUsers(usersObj, userEmail, userId);
        if (bestRes && bestRes.players.length > 0) {
          return { ...bestRes, error: null };
        }
      }
    } catch (e) {
      console.warn('Users RTDB scan warning:', e);
    }

    // 3. Fallback: Scan root node
    try {
      const rootSnap = await get(ref(rtdb));
      if (rootSnap.exists()) {
        const rootVal = rootSnap.val();
        if (rootVal && rootVal.users) {
          const bestRes = findBestUserNodeInUsers(rootVal.users, userEmail, userId);
          if (bestRes && bestRes.players.length > 0) {
            return { ...bestRes, error: null };
          }
        }
        const extracted = parsePlayersFromJson(rootVal);
        if (extracted.length > 0) {
          const derived = deriveTeamNames(extracted, 'VPM', 'VHP');
          return { players: extracted, teamA: derived.teamA, teamB: derived.teamB, error: null };
        }
      }
    } catch (e) {
      console.warn('SDK RTDB candidate path fetch warning:', e);
    }
  }

  // 4. Sample Fallback Players if DB is completely empty
  const SAMPLE_PLAYERS = [
    { id: 'p1', name: 'MARCO ZANGHERI', number: '7', role: 'OUTSIDE HITTER', team: 'VPM', active: true },
    { id: 'p2', name: 'GIANLUCA GALASSI', number: '11', role: 'MIDDLE BLOCKER', team: 'VPM', active: true },
    { id: 'p3', name: 'SIMONE GIANNELLI', number: '6', role: 'SETTER', team: 'VPM', active: true },
    { id: 'p4', name: 'FABIO BALASO', number: '14', role: 'LIBERO', team: 'VHP', active: true },
    { id: 'p5', name: 'YURI ROMANÒ', number: '16', role: 'OPPOSITE', team: 'VHP', active: true },
  ];
  return { players: SAMPLE_PLAYERS, teamA: 'VPM', teamB: 'VHP', error: null };
}

// Subscribe to active match formation & roster changes from Realtime DB in real time
export function subscribeToPlayersFromFirebase(userId = null, userEmail = null, callback = () => {}) {
  if (!rtdb) initFirebase();
  if (!rtdb) return () => {};

  const targetPath = userId ? `users/${userId}` : 'users';
  const targetRef = ref(rtdb, targetPath);

  const unsubscribe = onValue(targetRef, (snapshot) => {
    if (!snapshot.exists()) {
      fetchPlayersFromFirebase(userId, userEmail).then(res => callback(res));
      return;
    }

    const val = snapshot.val();
    if (userId) {
      const res = processUserRosterAndFormation(val);
      if (res && res.players && res.players.length > 0) {
        callback({ ...res, error: null });
        return;
      }
      // If user's specific node has no players yet, scan all users
      get(ref(rtdb, 'users')).then(usersSnap => {
        if (usersSnap.exists()) {
          const bestRes = findBestUserNodeInUsers(usersSnap.val(), userEmail, userId);
          if (bestRes && bestRes.players && bestRes.players.length > 0) {
            callback({ ...bestRes, error: null });
            return;
          }
        }
        fetchPlayersFromFirebase(null, userEmail).then(fallbackRes => callback(fallbackRes));
      });
    } else {
      const bestRes = findBestUserNodeInUsers(val, userEmail, userId);
      if (bestRes && bestRes.players && bestRes.players.length > 0) {
        callback({ ...bestRes, error: null });
        return;
      }
      fetchPlayersFromFirebase(null, userEmail).then(fallbackRes => callback(fallbackRes));
    }
  }, (err) => {
    console.warn('Realtime DB subscription warning:', err);
    fetchPlayersFromFirebase(userId, userEmail).then(res => callback(res));
  });

  return unsubscribe;
}

// Add/Save player into users/{userId}/players in Realtime DB
export async function addPlayerToFirebase(playerData, userId = null) {
  if (!userId || !rtdb) return { id: null, error: 'Please log in to save players to your account' };
  try {
    const userPlayersRef = ref(rtdb, `users/${userId}/players`);
    const snapshot = await get(userPlayersRef);
    let currentList = snapshot.exists() ? snapshot.val() : [];
    if (!Array.isArray(currentList)) {
      currentList = Object.values(currentList);
    }
    
    currentList.push(playerData);
    await set(userPlayersRef, currentList);
    
    return { id: 'p_' + Date.now(), error: null };
  } catch (err) {
    return { id: null, error: err.message };
  }
}
