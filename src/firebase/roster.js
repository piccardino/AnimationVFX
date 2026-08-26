// Roster & formation sync from Firebase Realtime Database
import { getDatabase, ref, get, child, set, onValue } from 'firebase/database';
import { rtdb, initFirebase } from './core';

export const SAMPLE_PLAYERS = [
  { id: 'p1', name: 'MARCO ZANGHERI', number: '7', role: 'OUTSIDE HITTER', team: 'VPM', active: true },
  { id: 'p2', name: 'GIANLUCA GALASSI', number: '11', role: 'MIDDLE BLOCKER', team: 'VPM', active: true },
  { id: 'p3', name: 'SIMONE GIANNELLI', number: '6', role: 'SETTER', team: 'VPM', active: true },
  { id: 'p4', name: 'FABIO BALASO', number: '14', role: 'LIBERO', team: 'VHP', active: true },
  { id: 'p5', name: 'YURI ROMANÒ', number: '16', role: 'OPPOSITE', team: 'VHP', active: true },
];

const SAMPLE_TEAMS = { teamA: 'VPM', teamB: 'VHP' };

/** Normalize a raw RTDB player entry into the shape used across the app */
export function extractPlayerNumber(p, fallbackIndex = null) {
  if (!p || typeof p !== 'object') return fallbackIndex !== null ? String(fallbackIndex) : '';
  const candidates = [p.number, p.num, p.shirtNumber];
  for (const c of candidates) {
    if (c !== undefined && c !== null && String(c).trim() !== '') return String(c).trim();
  }
  const fromName = typeof p.name === 'string' ? p.name.match(/#(\d+)/) : null;
  if (fromName) return fromName[1];
  return fallbackIndex !== null ? String(fallbackIndex) : '';
}

function normalizePlayer(raw, idx, defaultTeam) {
  const num = extractPlayerNumber(raw, idx + 1);
  return {
    ...raw,
    id: raw.id || `p_${idx}`,
    number: num,
    num,
    role: raw.role || raw.position || '',
    team: raw.team || defaultTeam,
    active: raw.active !== false,
  };
}

/** Team matching tolerant to prefixes like "TEAM_A", "1", "A" */
export function isMatchTeam(playerTeam, targetName, indexLetter) {
  if (!playerTeam || !targetName) return false;
  const pTag = String(playerTeam).trim().toUpperCase();
  const tTag = String(targetName).trim().toUpperCase();
  const aliases = {
    A: ['TEAM_A', 'TEAMA', 'SQUADRA_A', 'A', '1'],
    B: ['TEAM_B', 'TEAMB', 'SQUADRA_B', 'B', '2'],
  };
  if (pTag === tTag) return true;
  return (aliases[indexLetter] || []).includes(pTag);
}

/**
 * Extract active players + team names from a single user node.
 * Supports: users/{uid}/players array, formation slots ({teamA:[...],teamB:[...]})
 * and legacy team names stored under several keys.
 */
function processUserNode(uData) {
  if (!uData || typeof uData !== 'object') return null;

  const teams = uData.teams || {};
  const teamA =
    uData.teamA || uData.teamNameA || teams.teamA || teams.A || uData.match?.teamA || null;
  const teamB =
    uData.teamB || uData.teamNameB || teams.teamB || teams.B || uData.match?.teamB || null;
  const names = { teamA: teamA || SAMPLE_TEAMS.teamA, teamB: teamB || SAMPLE_TEAMS.teamB };

  let merged = [];

  // Formation slots first (only truly fielded players)
  const formation = uData.formation || uData.activeFormation;
  if (formation && typeof formation === 'object') {
    ['A', 'B'].forEach((side, si) => {
      const list = formation[`team${side}`] || formation[side] || [];
      const arr = Array.isArray(list) ? list : Object.values(list || {});
      arr.forEach((slot, i) => {
        if (!slot?.name) return;
        const fallbackTeam = si === 0 ? names.teamA : names.teamB;
        merged.push(normalizePlayer({ ...slot, team: slot.team || fallbackTeam }, i, fallbackTeam));
      });
    });
  }

  // Then fall back / merge with the full saved roster (active only)
  let roster = uData.players ?? uData.roster ?? [];
  roster = Array.isArray(roster) ? roster : Object.values(roster || {});
  const normalizedRoster = roster
    .filter((p) => p && p.name)
    .map((p, i) => normalizePlayer(p, i, names.teamA));

  const findMatch = (entry) =>
    normalizedRoster.find(
      (r) =>
        String(r.name).toLowerCase() === String(entry.name).toLowerCase() &&
        (!entry.number || !r.number || String(r.number) === String(entry.number))
    );

  if (merged.length) {
    merged = merged.map((m) => {
      const match = findMatch(m);
      return match ? { ...match, ...m, number: m.number || match.number } : m;
    });
  } else {
    merged = normalizedRoster.filter((p) => p.active);
  }

  return { players: merged, teamA: names.teamA, teamB: names.teamB };
}

/** Score user nodes when searching all accounts for a given email/username */
function scoreUserNode(uData, email, uid) {
  let best = processUserNode(uData);
  if (!best || !best.players.length) return null;

  let score = best.players.length;
  const userEmail = (email || '').toLowerCase();
  const nodeEmail = (uData.email || '').toLowerCase();
  const usernames = [
    ...(Array.isArray(uData.usernames) ? uData.usernames : []),
    uData.username,
  ].filter(Boolean).map((u) => String(u).toLowerCase());
  const localPart = userEmail.split('@')[0];

  if (nodeEmail && nodeEmail === userEmail) score += 1000;
  else if (userEmail && usernames.includes(userEmail)) score += 900;
  else if (userEmail && localPart && usernames.includes(localPart)) score += 800;
  if (uid && Object.keys(uData).length && arguments[3]) score += 0; // uid handled by direct path

  return { res: best, score };
}

async function fetchFallbackFromUsers(email, uid = null) {
  const db = getDatabase();
  const snap = await get(ref(db, 'users'));
  if (!snap.exists()) return sampleResult();
  let best = null;
  const entries = Object.entries(snap.val());
  for (const [key, uData] of entries) {
    const scored = scoreUserNode(uData, email, uid, key === uid);
    if (scored && (!best || scored.score > best.score)) best = scored;
  }
  return best?.res ? { ...best.res, error: null } : sampleResult();
}

function sampleResult() {
  return { players: SAMPLE_PLAYERS.map((p) => ({ ...p })), ...SAMPLE_TEAMS, error: null };
}

// One-time roster fetch: uid path first, then email/username scan, then demo sample
export async function fetchPlayersFromFirebase(userId = null, userEmail = null) {
  if (!rtdb) initFirebase();
  const db = rtdb || getDatabase();
  if (!db) return sampleResult();

  try {
    if (userId) {
      const snap = await get(child(ref(db), `users/${userId}`));
      if (snap.exists()) {
        const res = processUserNode(snap.val());
        if (res?.players?.length) return { ...res, error: null };
      }
    }
    return await fetchFallbackFromUsers(userEmail, userId);
  } catch (err) {
    console.warn('Roster fetch warning:', err);
    return { ...sampleResult(), error: err.message };
  }
}

// Realtime subscription with graceful degradation to one-shot fetch
export function subscribeToPlayersFromFirebase(userId = null, userEmail = null, callback = () => {}) {
  if (!rtdb) initFirebase();
  const db = rtdb;
  if (!db) return () => {};

  const unsubscribe = onValue(
    ref(db, userId ? `users/${userId}` : 'users'),
    async (snapshot) => {
      try {
        if (snapshot.exists()) {
          if (userId) {
            const res = processUserNode(snapshot.val());
            if (res?.players?.length) return callback({ ...res, error: null });
          } else {
            let best = null;
            for (const [key, uData] of Object.entries(snapshot.val())) {
              const scored = scoreUserNode(uData, userEmail, userId, key === userId);
              if (scored && (!best || scored.score > best.score)) best = scored;
            }
            if (best?.res?.players?.length) return callback({ ...best.res, error: null });
          }
        }
        // No usable data at this level: fall back once
        const fallback = await fetchPlayersFromFirebase(userId, userEmail);
        callback(fallback);
      } catch (err) {
        console.warn('Roster realtime processing warning:', err);
        callback(await fetchPlayersFromFirebase(userId, userEmail));
      }
    },
    async (err) => {
      console.warn('Realtime DB subscription warning:', err);
      callback(await fetchPlayersFromFirebase(userId, userEmail));
    }
  );

  return unsubscribe;
}

// Append a player to users/{uid}/players
export async function addPlayerToFirebase(playerData, userId = null) {
  if (!rtdb && !userId) initFirebase();
  const db = rtdb || getDatabase();
  if (!userId || !db) return { id: null, error: 'Accedi per salvare i giocatori sul tuo account' };
  try {
    const playersRef = ref(db, `users/${userId}/players`);
    const snapshot = await get(playersRef);
    let list = snapshot.exists() ? snapshot.val() : [];
    if (!Array.isArray(list)) list = Object.values(list || {});

    const numVal = extractPlayerNumber(playerData);
    list.push({ ...playerData, number: numVal, num: numVal, active: playerData.active !== false });
    await set(playersRef, list);

    return { id: 'p_' + Date.now(), error: null };
  } catch (err) {
    return { id: null, error: err.message };
  }
}

