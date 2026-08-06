import React from 'react';
import { Volume2, VolumeX, Video, Sparkles, User, LogOut } from 'lucide-react';
import { soundFX } from '../engine/soundEffects';

export default function Navbar({ soundEnabled, setSoundEnabled, activePreset, onQuickExport, user, onOpenAuth, onLogout }) {
  const toggleSound = () => {
    soundFX.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <div className="brand-group">
          <div className="logo-icon-wrapper">
            <span className="logo-emoji">🏐</span>
            <div className="logo-glow"></div>
          </div>
          <div>
            <h1 className="brand-title">
              VOLLEY<span className="brand-highlight">VFX</span> STUDIO
            </h1>
            <p className="brand-subtitle">Volleyball Video Animations & Overlays</p>
          </div>
        </div>

        {/* Center Preset Badge */}
        <div className="active-preset-badge">
          <Sparkles className="badge-icon text-cyan-400" size={16} />
          <span className="badge-label">Active Preset:</span>
          <span className="badge-value">{activePreset.name}</span>
        </div>

        {/* Right Controls */}
        <div className="nav-actions">
          {/* Firebase User Login Button */}
          {user ? (
            <div className="user-profile-pill">
              <User size={14} className="text-cyan-400" />
              <span className="user-email-text">{user.email}</span>
              <button onClick={onLogout} className="btn-logout-icon" title="Sign Out">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-secondary-sm">
              <User size={16} />
              <span>Sign In / Login</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`btn-icon ${soundEnabled ? 'btn-sound-active' : 'btn-sound-muted'}`}
            title={soundEnabled ? 'Disable Sound Effects' : 'Enable Sound Effects'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          {/* Quick Export MP4 */}
          <button onClick={onQuickExport} className="btn-primary">
            <Video size={18} />
            <span>Download MP4</span>
          </button>
        </div>
      </div>
    </header>
  );
}
