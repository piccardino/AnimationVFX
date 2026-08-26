// Public Firebase API barrel: auth (core) + roster/formation sync (rtdb)
export {
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig,
  initFirebase,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  completeGoogleSignIn,
  logout,
  subscribeToAuth,
} from './core';

export {
  SAMPLE_PLAYERS,
  extractPlayerNumber,
  isMatchTeam,
  fetchPlayersFromFirebase,
  subscribeToPlayersFromFirebase,
  addPlayerToFirebase,
} from './roster';
