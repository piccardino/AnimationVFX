import React, { useState, useEffect } from 'react';
import { Database, UserCheck, RefreshCw } from 'lucide-react';
import { fetchPlayersFromFirebase, subscribeToPlayersFromFirebase } from '../firebase/firebase';

const TEAM_COLOR_SCHEMES = {
  A: { primary: '#00f0ff', secondary: '#7000ff', badge: '🔵' },
  B: { primary: '#ff0055', secondary: '#ffcc00', badge: '🔴' }
};

const SAMPLE_FALLBACK_PLAYERS = [
  { id: 'p1', name: 'MARCO ZANGHERI', number: '7', role: 'OUTSIDE HITTER', team: 'VPM' },
  { id: 'p2', name: 'GIANLUCA GALASSI', number: '11', role: 'MIDDLE BLOCKER', team: 'VPM' },
  { id: 'p3', name: 'SIMONE GIANNELLI', number: '6', role: 'SETTER', team: 'VPM' },
  { id: 'p4', name: 'FABIO BALASO', number: '14', role: 'LIBERO', team: 'VHP' },
  { id: 'p5', name: 'YURI ROMANÒ', number: '16', role: 'OPPOSITE', team: 'VHP' },
];

export default function PlayerFirebaseSelector({ user, onSelectPlayer, onOpenAuth }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL'); // 'ALL' | 'TEAM_A' | 'TEAM_B'
  const [teamNames, setTeamNames] = useState({ teamA: 'VPM', teamB: 'VHP' });
  const [statusMsg, setStatusMsg] = useState('');

  const loadPlayersManual = async () => {
    setLoading(true);
    setStatusMsg('');
    const res = await fetchPlayersFromFirebase(user ? user.uid : null, user ? user.email : null);
    setLoading(false);

    if (res && res.teamA) {
      setTeamNames({ teamA: res.teamA, teamB: res.teamB });
    }

    if (res && res.players && res.players.length > 0) {
      setPlayers(res.players);
      setStatusMsg(user ? `Active roster ${res.teamA} & ${res.teamB} loaded!` : `${res.players.length} active players!`);
    } else {
      setPlayers(SAMPLE_FALLBACK_PLAYERS);
      setStatusMsg('Demo roster loaded.');
    }
  };

  useEffect(() => {
    setLoading(true);
    setStatusMsg('Connecting to Realtime DB...');

    const unsubscribe = subscribeToPlayersFromFirebase(
      user ? user.uid : null,
      user ? user.email : null,
      (res) => {
        setLoading(false);
        if (res && res.teamA) {
          setTeamNames({ teamA: res.teamA, teamB: res.teamB });
        }

        if (res && res.players && res.players.length > 0) {
          setPlayers(res.players);
          setStatusMsg(user ? `Sync: ${res.teamA} vs ${res.teamB}` : `${res.players.length} players synced!`);

          // Select first player if none selected yet
          const firstP = res.players[0];
          const isTeamB = isMatchTeam(firstP.team, res.teamB, 'B');
          const palette = isTeamB ? TEAM_COLOR_SCHEMES.B : TEAM_COLOR_SCHEMES.A;
          if (onSelectPlayer) {
            onSelectPlayer({
              name: firstP.name,
              number: firstP.number,
              role: firstP.role,
              team: firstP.team || res.teamA,
              primaryColor: palette.primary,
              secondaryColor: palette.secondary
            });
          }
        } else {
          setPlayers(SAMPLE_FALLBACK_PLAYERS);
          setTeamNames({ teamA: 'VPM', teamB: 'VHP' });
          setStatusMsg('Demo roster loaded.');
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSelect = (e) => {
    const selectedId = e.target.value;
    const player = players.find((p) => p.id === selectedId);
    if (player && onSelectPlayer) {
      const isTeamB = isMatchTeam(player.team, teamNames.teamB, 'B');
      const palette = isTeamB ? TEAM_COLOR_SCHEMES.B : TEAM_COLOR_SCHEMES.A;

      onSelectPlayer({
        name: player.name,
        number: player.number,
        role: player.role,
        team: player.team || teamNames.teamA,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary
      });
    }
  };

  // Robust check for team matching
  const isMatchTeam = (playerTeam, targetTeamName, teamIndex) => {
    if (!playerTeam) return false;
    const pTag = String(playerTeam).trim().toUpperCase();
    const tTag = String(targetTeamName || '').trim().toUpperCase();

    if (tTag && (pTag === tTag || pTag.includes(tTag) || tTag.includes(pTag))) return true;
    if (teamIndex === 'A' && (pTag === 'TEAM-A' || pTag === 'TEAM_A' || pTag === 'A' || pTag === 'VPM')) return true;
    if (teamIndex === 'B' && (pTag === 'TEAM-B' || pTag === 'TEAM_B' || pTag === 'B' || pTag === 'VHP')) return true;

    return false;
  };

  const filteredPlayers = players.filter((p) => {
    if (selectedTeamFilter === 'ALL') return true;
    if (selectedTeamFilter === 'TEAM_A') {
      return isMatchTeam(p.team, teamNames.teamA, 'A') || !p.team;
    }
    if (selectedTeamFilter === 'TEAM_B') {
      return isMatchTeam(p.team, teamNames.teamB, 'B');
    }
    return true;
  });

  const teamAPlayers = players.filter((p) => isMatchTeam(p.team, teamNames.teamA, 'A') || !p.team);
  const teamBPlayers = players.filter((p) => isMatchTeam(p.team, teamNames.teamB, 'B'));

  return (
    <div className="firebase-player-selector-box">
      <div className="firebase-box-header">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-cyan-400" />
          <span className="font-bold text-sm text-white">Active Players ({teamNames.teamA} vs {teamNames.teamB})</span>
        </div>

        {user ? (
          <span className="user-logged-badge">
            <UserCheck size={12} /> {user.email.split('@')[0]}
          </span>
        ) : (
          <button onClick={onOpenAuth} className="btn-auth-link">
            Config / Sign In
          </button>
        )}
      </div>

      {statusMsg && <p className="text-xs text-cyan-300 font-bold mb-2">{statusMsg}</p>}

      {/* Dynamic Team Selector Tabs */}
      <div className="team-buttons-row mb-3">
        <button
          onClick={() => setSelectedTeamFilter('ALL')}
          className={`team-btn team-btn-all ${selectedTeamFilter === 'ALL' ? 'active' : ''}`}
        >
          <span>All ({players.length})</span>
        </button>

        <button
          onClick={() => setSelectedTeamFilter('TEAM_A')}
          className={`team-btn team-btn-vpm ${selectedTeamFilter === 'TEAM_A' ? 'active' : ''}`}
        >
          <span className="team-badge-icon">🔵</span>
          <span className="font-black tracking-wider">{teamNames.teamA}</span>
          <span className="team-count-pill">{teamAPlayers.length}</span>
        </button>

        <button
          onClick={() => setSelectedTeamFilter('TEAM_B')}
          className={`team-btn team-btn-vhu ${selectedTeamFilter === 'TEAM_B' ? 'active' : ''}`}
        >
          <span className="team-badge-icon">🔴</span>
          <span className="font-black tracking-wider">{teamNames.teamB}</span>
          <span className="team-count-pill">{teamBPlayers.length}</span>
        </button>
      </div>

      {/* Select Player Dropdown */}
      <div className="input-group" style={{ marginBottom: '0.6rem' }}>
        <label className="input-label-sm">Select Player for Overlay:</label>
        <div className="flex gap-2">
          <select onChange={handleSelect} className="input-text" defaultValue="">
            <option value="" disabled>-- Choose a player on court --</option>
            {filteredPlayers.map((p) => {
              const isTeamB = isMatchTeam(p.team, teamNames.teamB, 'B');
              const teamTag = isTeamB ? `🔴 ${teamNames.teamB}` : `🔵 ${teamNames.teamA}`;
              return (
                <option key={p.id} value={p.id}>
                  [{teamTag}] #{p.number} - {p.name} ({p.role})
                </option>
              );
            })}
          </select>

          <button onClick={loadPlayersManual} className="btn-icon-md" title="Reload from Firebase DB">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
