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
  set
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
      app = getApp();
    }
    
    if (app) {
      auth = getAuth(app);
      // Use localStorage persistence. IndexedDB persistence (the default) throws
      // "Database is closing/hidden" whenever this tab becomes hidden (e.g. behind the Google
      // sign-in popup), which aborts the whole sign-in. localStorage has no such guard.
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

// Complete any pending Google redirect sign-in as early as possible so that onAuthStateChanged
// delivers the signed-in user right after returning from Google.
completeGoogleSignIn().then((res) => {
  if (res && res.error) {
    console.error('[Firebase] Pending Google sign-in could not be completed:', res.error);
  }
});

export { auth, rtdb };

// Auth Helper Functions
// Map raw Firebase errors (incl. raw server strings) to user-friendly messages.
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
    // CRITICAL: force localStorage persistence BEFORE signing in. The default IndexedDB
    // persistence throws "Database is closing/hidden" whenever this tab is hidden behind the
    // Google popup, aborting the entire sign-in. localStorage has no such visibility guard.
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err) };
  }
}

// Pick up the Google sign-in result after the redirect back to the app (legacy safety net for
// any sign-in started before the popup flow).
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

// Map raw role from DB (e.g. Setter, Middle Blocker, Univ, Palleggiatore, Centrale, Schiacciatore, Opposto) to Official English Volleyball Role
export function normalizeRole(rawRole) {
  if (!rawRole) return 'OUTSIDE HITTER';
  const r = String(rawRole).trim();
  const lower = r.toLowerCase();

  if (lower.includes('univ') || lower.includes('universal') || lower.includes('universale')) return 'UNIVERSAL';
  if (lower.includes('setter') || lower.includes('palleggi') || lower === 'p') return 'SETTER';
  if (lower.includes('middle') || lower.includes('central') || lower.includes('blocker') || lower === 'c') return 'MIDDLE BLOCKER';
  if (lower.includes('outside') || lower.includes('schiacc') || lower.includes('hitter') || lower === 's') return 'OUTSIDE HITTER';
  if (lower.includes('opposit') || lower.includes('oppost') || lower === 'o') return 'OPPOSITE';
  if (lower.includes('libero') || lower === 'l') return 'LIBERO';

  return r.toUpperCase();
}

// Flexible player matcher between court tokens and roster database
function matchPlayerInRoster(tokenName, roster) {
  if (!tokenName || !roster || roster.length === 0) return null;
  const tClean = String(tokenName).trim().toUpperCase();

  // 1. Exact name match
  let found = roster.find(r => String(r.name).trim().toUpperCase() === tClean);
  if (found) return found;

  // 2. Contains match (e.g. "ZANGHERI" inside "MARCO ZANGHERI")
  found = roster.find(r => {
    const rClean = String(r.name).trim().toUpperCase();
    return rClean.includes(tClean) || tClean.includes(rClean);
  });
  if (found) return found;

  // 3. Word / Surname match
  const tWords = tClean.split(/\s+/);
  const tLastName = tWords[tWords.length - 1];
  if (tLastName && tLastName.length >= 3) {
    found = roster.find(r => {
      const rClean = String(r.name).trim().toUpperCase();
      return rClean.includes(tLastName);
    });
    if (found) return found;
  }

  return null;
}

// Extract raw team name if present or infer from database path
function extractTeamTag(p, path = '') {
  if (p && typeof p === 'object') {
    const raw = String(p.team || p.squadra || p.side || p.teamName || p.group || p.club || p.team_code || '').trim().toUpperCase();
    if (raw) return raw;
  }
  if (path) {
    const parts = String(path).toUpperCase().split(/[/._-]/);
    for (const part of parts) {
      if (part === 'VPM' || part === 'VHP' || part === 'VHU') return part;
    }
  }
  return null;
}

// Check if a node represents an individual player vs a container (team, match, user, list)
function isPlayerNode(node) {
  if (!node || typeof node !== 'object') return false;
  // A container node contains child lists or structures
  if (node.players || node.roster || node.giocatori || node.members || node.tokens || node.formation || node.matchData) {
    return false;
  }
  const name = node.name || node.nome || node.fullname || node.giocatore || node.player || node.cognome;
  const number = node.number || node.numero || node.maglia || node.jersey || node.n || node.num;
  const role = node.role || node.ruolo || node.posizione || node.position;

  if (!name && !(number && role)) return false;

  // Avoid matching team / match container name as a player name
  const nStr = String(name || '').trim().toLowerCase();
  if (nStr.includes('team') || nStr.includes('squadra') || nStr.includes('club') || nStr.includes('match') || nStr === 'vpm' || nStr === 'vhp' || nStr === 'vhu') {
    if (!number && !role) return false;
  }

  return true;
}

// Parse players from Realtime Database array/object structure
export function parsePlayersFromJson(data) {
  const players = [];
  if (!data) return players;

  function scan(node, path = '', parentTeamTag = null) {
    if (!node || typeof node !== 'object') return;

    let currentTeamTag = extractTeamTag(node, path) || parentTeamTag;

    if (node.name && (node.players || node.roster || node.giocatori)) {
      currentTeamTag = String(node.name).trim().toUpperCase();
    }

    if (isPlayerNode(node) && node.active !== false) {
      const name = node.name || node.nome || node.fullname || node.giocatore || node.player || node.cognome;
      const number = node.number || node.numero || node.maglia || node.jersey || node.n || node.num || node.id;
      const role = node.role || node.ruolo || node.posizione || node.position;

      players.push({
        id: path || 'p_' + Math.random().toString(36).substring(2, 9),
        name: String(name || 'PLAYER').toUpperCase(),
        number: String(number || '0'),
        role: normalizeRole(role),
        team: currentTeamTag,
        active: node.active !== false
      });
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, idx) => scan(item, path ? `${path}/${idx}` : `${idx}`, currentTeamTag));
    } else {
      for (const key of Object.keys(node)) {
        let childTeam = currentTeamTag;
        const keyUpper = key.toUpperCase();
        if (keyUpper === 'VPM' || keyUpper === 'VHP' || keyUpper === 'VHU') {
          childTeam = keyUpper;
        }
        scan(node[key], path ? `${path}/${key}` : key, childTeam);
      }
    }
  }

  scan(data);
  return players;
}

// Direct fetch from custom URL without login
export async function fetchPlayersFromCustomUrl(urlInput) {
  try {
    let cleanUrl = urlInput.trim();
    if (!cleanUrl.endsWith('.json')) {
      cleanUrl = cleanUrl.replace(/\/$/, '') + '/.json';
    }
    const response = await fetch(cleanUrl);
    if (response.ok) {
      const json = await response.json();
      if (json) {
        const extracted = parsePlayersFromJson(json);
        if (extracted.length > 0) {
          return { players: extracted, error: null };
        }
      }
    }
    return { players: [], error: 'No players found in JSON structure' };
  } catch (err) {
    return { players: [], error: err.message };
  }
}

// Fetch user profile username from RTDB users/{uid}/profile
export async function fetchUserProfile(uid) {
  if (!rtdb || !uid) return null;
  try {
    const snapshot = await get(child(ref(rtdb), `users/${uid}/profile`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (e) {
    console.warn('Error fetching profile:', e);
  }
  return null;
}

// Helper to extract team names from player list if available
function deriveTeamNames(players, defaultA = 'VPM', defaultB = 'VHP') {
  if (!players || !Array.isArray(players)) return { teamA: defaultA, teamB: defaultB };
  const rawTeams = Array.from(new Set(players.map(p => p && p.team).filter(Boolean)));
  
  let teamA = defaultA;
  let teamB = defaultB;

  if (rawTeams.length >= 2) {
    teamA = rawTeams[0];
    teamB = rawTeams[1];
  } else if (rawTeams.length === 1) {
    teamA = rawTeams[0];
    if (teamA === 'VPM') teamB = 'VHP';
    else if (teamA === 'VHP' || teamA === 'VHU') teamB = 'VPM';
  }

  const hasVPM = rawTeams.find(t => t === 'VPM');
  const hasVHP = rawTeams.find(t => t === 'VHP' || t === 'VHU');
  if (hasVPM && hasVHP) {
    teamA = 'VPM';
    teamB = hasVHP;
  }

  return { teamA, teamB };
}

// Fetch active match formation & roster from Realtime DB
export async function fetchPlayersFromFirebase(userId = null) {
  if (!rtdb) initFirebase();

  // 1. Try fetching logged-in user's custom formation & roster
  if (userId && rtdb) {
    try {
      const formationSnap = await get(child(ref(rtdb), `users/${userId}/matchData/formation`));
      const playersSnap = await get(child(ref(rtdb), `users/${userId}/players`));
      
      const allRoster = playersSnap.exists() ? parsePlayersFromJson(playersSnap.val()) : [];
      let activeFormationPlayers = [];
      let teamNameA = 'VPM';
      let teamNameB = 'VHP';

      if (formationSnap.exists()) {
        const fData = formationSnap.val();
        if (fData) {
          if (fData.benchA && String(fData.benchA).trim()) teamNameA = String(fData.benchA).trim().toUpperCase();
          if (fData.benchB && String(fData.benchB).trim()) teamNameB = String(fData.benchB).trim().toUpperCase();
        }

        if (fData && fData.tokens && Array.isArray(fData.tokens)) {
          fData.tokens.forEach((t, idx) => {
            if (t && t.name) {
              const matchedInRoster = matchPlayerInRoster(t.name, allRoster);
              const isTeamA = (t.team === 'team-a' || t.team === 'A' || String(t.team).toUpperCase() === teamNameA);
              const teamCode = isTeamA ? teamNameA : teamNameB;
              
              // Prioritize real roster role over generic token 'Universal' string
              let resolvedRole = 'OUTSIDE HITTER';
              if (matchedInRoster && matchedInRoster.role) {
                resolvedRole = normalizeRole(matchedInRoster.role);
              } else if (t.role && t.role !== 'Universal') {
                resolvedRole = normalizeRole(t.role);
              } else if (t.role === 'Libero') {
                resolvedRole = 'LIBERO';
              }

              activeFormationPlayers.push({
                id: matchedInRoster ? matchedInRoster.id : 'token_' + idx,
                name: matchedInRoster ? matchedInRoster.name : String(t.name).toUpperCase(),
                number: matchedInRoster ? matchedInRoster.number : String(idx + 1),
                role: resolvedRole,
                team: teamCode,
                active: true
              });
            }
          });
        }
      }

      if (activeFormationPlayers.length > 0) {
        allRoster.forEach(r => {
          if (!activeFormationPlayers.some(ap => ap.name === r.name)) {
            activeFormationPlayers.push({
              ...r,
              team: r.team || teamNameA
            });
          }
        });
        const derived = deriveTeamNames(activeFormationPlayers, teamNameA, teamNameB);
        return { players: activeFormationPlayers, teamA: derived.teamA, teamB: derived.teamB, error: null };
      }

      if (allRoster.length > 0) {
        const derived = deriveTeamNames(allRoster, teamNameA, teamNameB);
        return { players: allRoster, teamA: derived.teamA, teamB: derived.teamB, error: null };
      }
    } catch (e) {
      console.warn('User RTDB fetch warning:', e);
    }
  }

  // 2. Fallback: Query RTDB using authenticated Firebase SDK (rtdb) over multiple candidate nodes
  if (rtdb) {
    const candidatePaths = ['', 'users', 'players', 'matchData', 'teams', 'squadre'];
    for (const p of candidatePaths) {
      try {
        const snap = p ? await get(child(ref(rtdb), p)) : await get(ref(rtdb));
        if (snap.exists()) {
          const snapData = snap.val();
          const extracted = parsePlayersFromJson(snapData);
          if (extracted.length > 0) {
            let teamA = 'VPM';
            let teamB = 'VHP';

            function findBenches(node) {
              if (!node || typeof node !== 'object') return;
              if (node.benchA && String(node.benchA).trim()) teamA = String(node.benchA).trim().toUpperCase();
              if (node.benchB && String(node.benchB).trim()) teamB = String(node.benchB).trim().toUpperCase();
              if (teamA !== 'VPM' && teamB !== 'VHP') return;
              for (const k of Object.keys(node)) {
                if (typeof node[k] === 'object' && node[k] !== null) findBenches(node[k]);
              }
            }
            findBenches(snapData);

            const derived = deriveTeamNames(extracted, teamA, teamB);
            return { players: extracted, teamA: derived.teamA, teamB: derived.teamB, error: null };
          }
        }
      } catch (e) {
        console.warn(`SDK RTDB candidate path '${p}' fetch warning:`, e);
      }
    }
  }

  // 3. Direct fetch from URL (legacy HTTP fallback)
  const dbUrl = "https://volley-hub-c90ca-default-rtdb.europe-west1.firebasedatabase.app";
  try {
    const response = await fetch(`${dbUrl}/.json`);
    if (response.ok) {
      const json = await response.json();
      if (json && !json.error) {
        const extracted = parsePlayersFromJson(json);
        if (extracted.length > 0) {
          const derived = deriveTeamNames(extracted, 'VPM', 'VHP');
          return { players: extracted, teamA: derived.teamA, teamB: derived.teamB, error: null };
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return { players: [], teamA: 'VPM', teamB: 'VHP', error: 'No players found in DB' };
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
