// Top navigation bar: branding, preset badge, auth state, sound toggle & quick export
import { Volume2, VolumeX, Clapperboard, Sparkles, User, LogOut } from 'lucide-react';
import { soundFX } from '../engine/audio';

export default function Navbar({
  soundEnabled,
  onToggleSound,
  activePreset,
  onQuickExport,
  user,
  onOpenAuth,
  onLogout,
}) {
  const toggleSound = () => {
    soundFX.setEnabled(!soundEnabled);
    onToggleSound(!soundEnabled);
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="brand">
          <span className="brand__logo">🏐</span>
          <div className="brand__text">
            <h1>
              VOLLEY<span>VFX</span> STUDIO
            </h1>
            <p>Animazioni & Overlay Broadcast per Pallavolo</p>
          </div>
        </div>

        <div className="navbar__preset">
          <Sparkles size={15} />
          <span>Preset attivo:</span>
          <strong>{activePreset.name}</strong>
        </div>

        <div className="navbar__actions">
          {user ? (
            <div className="user-pill">
              <User size={14} />
              <span>{user.email}</span>
              <button onClick={onLogout} title="Esci" aria-label="Esci">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn btn--ghost">
              <User size={16} />
              Accedi
            </button>
          )}

          <button
            onClick={toggleSound}
            className={`btn-icon ${soundEnabled ? 'btn-icon--on' : ''}`}
            title={soundEnabled ? 'Disattiva effetti sonori' : 'Attiva effetti sonori'}
          >
            {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>

          <button onClick={onQuickExport} className="btn btn--primary">
            <Clapperboard size={17} />
            Esporta MP4
          </button>
        </div>
      </div>
    </header>
  );
}
