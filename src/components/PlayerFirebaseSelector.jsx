// Live roster selector synced with Firebase Realtime DB
import { useState, useEffect } from 'react';
import { Database, RefreshCw, UserCheck } from 'lucide-react';
import {
  fetchPlayersFromFirebase,
  subscribeToPlayersFromFirebase,
  isMatchTeam,
  SAMPLE_PLAYERS,
} from '../firebase/firebase';

const TEAM_SCHEMES = {
  A: { primary: '#00f0ff', secondary: '#7000ff' },
  B: { primary: '#ff0055', secondary: '#ffcc00' },
};

function schemeFor(player, teamA, teamB) {
  const isB = isMatchTeam(player.team, teamB, 'B');
  return isB ? TEAM_SCHEMES.B : TEAM_SCHEMES.A;
}

export default function PlayerFirebaseSelector({ user, onSelectPlayer, onOpenAuth }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [teams, setTeams] = useState({ teamA: 'VPM', teamB: 'VHP' });
  const [status, setStatus] = useState('Connessione al Realtime DB…');

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const unsubscribe = subscribeToPlayersFromFirebase(
      user?.uid ?? null,
      user?.email ?? null,
      (res) => {
        if (!alive) return;
        setLoading(false);
        if (res?.players?.length) {
          setPlayers(res.players);
          if (res.teamA && res.teamB) setTeams({ teamA: res.teamA, teamB: res.teamB });
          setStatus(user ? `Sync: ${res.teamA} vs ${res.teamB}` : `${res.players.length} giocatori sincronizzati`);

          // Auto-select the first available player
          const first = res.players[0];
          const palette = schemeFor(first, res.teamA, res.teamB);
          onSelectPlayer?.({
            name: first.name,
            number: first.number ?? first.num ?? '',
            role: first.role || '',
            team: first.team || res.teamA,
            ...palette,
          });
        } else {
          setPlayers(SAMPLE_PLAYERS);
          setTeams({ teamA: 'VPM', teamB: 'VHP' });
          setStatus('Roster demo caricato.');
        }
      }
    );

    return () => {
      alive = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const reload = async () => {
    setLoading(true);
    const res = await fetchPlayersFromFirebase(user?.uid ?? null, user?.email ?? null);
    setLoading(false);
    if (res?.teamA) setTeams({ teamA: res.teamA, teamB: res.teamB });
    setPlayers(res?.players?.length ? res.players : SAMPLE_PLAYERS);
    setStatus(res?.players?.length ? `Roster ${res.teamA} & ${res.teamB} caricato` : 'Roster demo caricato.');
  };

  const filtered = players.filter((p) => p.active !== false).filter((p) => {
    if (filter === 'ALL') return true;
    if (filter === 'A') return isMatchTeam(p.team, teams.teamA, 'A') || !p.team;
    return isMatchTeam(p.team, teams.teamB, 'B');
  });

  const countA = players.filter((p) => p.active !== false && (isMatchTeam(p.team, teams.teamA, 'A') || !p.team)).length;
  const countB = players.filter((p) => p.active !== false && isMatchTeam(p.team, teams.teamB, 'B')).length;

  return (
    <div className="roster">
      <header className="roster__head">
        <span>
          <Database size={14} /> Roster attivo ({teams.teamA} vs {teams.teamB})
        </span>
        {user ? (
          <small className="roster__user">
            <UserCheck size={12} /> {user.email.split('@')[0]}
          </small>
        ) : (
          <button onClick={onOpenAuth} className="btn btn--link">
            Accedi per sincronizzare
          </button>
        )}
      </header>

      {status && <p className="roster__status">{status}</p>}

      <div className="roster__filters">
        {[['ALL', `Tutti (${players.length})`], ['A', `🔵 ${teams.teamA} (${countA})`], ['B', `🔴 ${teams.teamB} (${countB})`]].map(
          ([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`chip chip--tiny ${filter === id ? 'chip--active' : ''}`}
            >
              {label}
            </button>
          )
        )}
      </div>

      <div className="field field--row">
        <span>Giocatore in campo:</span>
        <select
          className="select"
          defaultValue=""
          onChange={(e) => {
            const player = players.find((p) => p.id === e.target.value);
            if (!player || !onSelectPlayer) return;
            const palette = schemeFor(player, teams.teamA, teams.teamB);
            onSelectPlayer({
              name: player.name,
              number: player.number ?? player.num ?? '',
              role: player.role || '',
              team: player.team || '',
              ...palette,
            });
          }}
        >
          <option value="" disabled>
            — Scegli un giocatore —
          </option>
          {filtered.map((p) => (
            <option key={p.id} value={p.id}>
              [{isMatchTeam(p.team, teams.teamB, 'B') ? `🔴 ${teams.teamB}` : `🔵 ${teams.teamA}`}]
              #{p.number ?? p.num ?? '?'} – {p.name} ({p.role})
            </option>
          ))}
        </select>

        <button onClick={reload} className="btn-icon" title="Ricarica dal database">
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
        </button>
      </div>
    </div>
  );
}
