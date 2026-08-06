import React, { useState } from 'react';
import { Type, Palette, Sliders, Volume2, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { soundFX } from '../engine/soundEffects';
import PlayerFirebaseSelector from './PlayerFirebaseSelector';

const COLOR_THEMES = [
  { name: 'Neon Cyber', primary: '#00e5ff', secondary: '#7c4dff', accent: '#ffffff' },
  { name: 'Fire & Ice', primary: '#ff3d00', secondary: '#00e5ff', accent: '#ffffff' },
  { name: 'Azzurri Blue', primary: '#0055ff', secondary: '#00ccff', accent: '#ffffff' },
  { name: 'Champions Gold', primary: '#ffd700', secondary: '#ff007f', accent: '#ffffff' },
  { name: 'Volcano Red', primary: '#dc2626', secondary: '#f59e0b', accent: '#ffffff' },
  { name: 'Emerald Victory', primary: '#00ff87', secondary: '#06b6d4', accent: '#ffffff' },
];

const TEXT_QUICK_PRESETS = [
  'MONSTER BLOCK',
  'SUPER SPIKE!',
  'SERVICE ACE!',
  'GREAT DIG!',
  'PERFECT SET',
  'MATCH POINT',
  'KILL BLOCK!',
  '115 KM/H CANNONBALL'
];

export default function ControlsPanel({ config, setConfig, user, onOpenAuth }) {
  const [activeTab, setActiveTab] = useState('text');

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const applyColorTheme = (theme) => {
    setConfig((prev) => ({
      ...prev,
      primaryColor: theme.primary,
      secondaryColor: theme.secondary,
      accentColor: theme.accent,
    }));
  };

  const handleSelectFirebasePlayer = ({ name, number, role, team, primaryColor, secondaryColor }) => {
    const pNum = number !== undefined && number !== null ? String(number) : '';
    const selPlayer = { name, number: pNum, role, team, primaryColor, secondaryColor };
    const numPrefix = pNum ? `#${pNum} • ` : '';
    setConfig((prev) => {
      const isPlayerCard = prev.presetId === 'player_card';
      return {
        ...prev,
        selectedPlayer: selPlayer,
        mainText: isPlayerCard ? name : prev.mainText,
        subText: isPlayerCard ? `${numPrefix}${role}` : `${name}\n${numPrefix}${role}`,
        primaryColor: primaryColor || prev.primaryColor,
        secondaryColor: secondaryColor || prev.secondaryColor,
      };
    });
  };

  return (
    <div className="controls-card">
      {/* Tabs Header */}
      <div className="controls-tabs">
        <button
          onClick={() => setActiveTab('text')}
          className={`tab-btn ${activeTab === 'text' ? 'tab-active' : ''}`}
        >
          <Type size={16} />
          <span>Text</span>
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          className={`tab-btn ${activeTab === 'colors' ? 'tab-active' : ''}`}
        >
          <Palette size={16} />
          <span>Colors</span>
        </button>

        <button
          onClick={() => setActiveTab('effects')}
          className={`tab-btn ${activeTab === 'effects' ? 'tab-active' : ''}`}
        >
          <Sliders size={16} />
          <span>Effects</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`tab-btn ${activeTab === 'audio' ? 'tab-active' : ''}`}
        >
          <Volume2 size={16} />
          <span>Audio</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="controls-body">
        {/* TAB 1: TEXT CUSTOMIZATION */}
        {activeTab === 'text' && (
          <div className="tab-pane">
            {/* Firebase Player Selector */}
            <PlayerFirebaseSelector
              user={user}
              onSelectPlayer={handleSelectFirebasePlayer}
              onOpenAuth={onOpenAuth}
            />

            <div className="input-group">
              <label className="input-label">Main Text (Title / Name)</label>
              <input
                type="text"
                value={config.mainText || ''}
                onChange={(e) => updateConfig('mainText', e.target.value)}
                className="input-text"
                placeholder="E.g. MONSTER BLOCK"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Subtitle / Number & Role</label>
              <input
                type="text"
                value={config.subText || ''}
                onChange={(e) => updateConfig('subText', e.target.value)}
                className="input-text"
                placeholder="E.g. #7 • OUTSIDE HITTER"
              />
            </div>

            {/* Quick Text Ideas */}
            <div className="quick-presets-group">
              <label className="input-label-sm">Quick Text Ideas:</label>
              <div className="chips-grid">
                {TEXT_QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => updateConfig('mainText', preset)}
                    className="chip-btn"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COLOR THEMES */}
        {activeTab === 'colors' && (
          <div className="tab-pane">
            <label className="input-label">Preset Color Themes</label>
            <div className="themes-grid">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => applyColorTheme(theme)}
                  className="theme-card-btn"
                >
                  <div className="theme-swatch">
                    <span style={{ backgroundColor: theme.primary }}></span>
                    <span style={{ backgroundColor: theme.secondary }}></span>
                    <span style={{ backgroundColor: theme.accent }}></span>
                  </div>
                  <span className="theme-name">{theme.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Color Pickers */}
            <div className="color-pickers-row">
              <div className="color-picker-item">
                <label>Primary Color</label>
                <input
                  type="color"
                  value={config.primaryColor || '#00e5ff'}
                  onChange={(e) => updateConfig('primaryColor', e.target.value)}
                  className="color-input"
                />
              </div>

              <div className="color-picker-item">
                <label>Secondary Color</label>
                <input
                  type="color"
                  value={config.secondaryColor || '#7c4dff'}
                  onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                  className="color-input"
                />
              </div>

              <div className="color-picker-item">
                <label>Accent Color</label>
                <input
                  type="color"
                  value={config.accentColor || '#ffffff'}
                  onChange={(e) => updateConfig('accentColor', e.target.value)}
                  className="color-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANIMATION & VFX PARAMETERS */}
        {activeTab === 'effects' && (
          <div className="tab-pane">
            {/* Duration Slider */}
            <div className="slider-group">
              <div className="slider-header">
                <label className="input-label">Video Clip Duration (Seconds)</label>
                <span className="slider-value">{config.duration || 3.5}s</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="6.0"
                step="0.5"
                value={config.duration || 3.5}
                onChange={(e) => updateConfig('duration', parseFloat(e.target.value))}
                className="range-input"
              />
            </div>

            {/* Line Thickness / VFX Scale Slider */}
            <div className="slider-group">
              <div className="slider-header">
                <label className="input-label">Line & Effect Thickness</label>
                <span className="slider-value">{(config.lineThickness !== undefined ? config.lineThickness : 0.8).toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.0"
                step="0.1"
                value={config.lineThickness !== undefined ? config.lineThickness : 0.8}
                onChange={(e) => updateConfig('lineThickness', parseFloat(e.target.value))}
                className="range-input"
              />
            </div>

            {/* Export Frame Rate (FPS) */}
            <div className="slider-group">
              <div className="slider-header">
                <label className="input-label">Export Smoothness (FPS)</label>
              </div>
              <div className="chips-grid">
                <button
                  type="button"
                  onClick={() => updateConfig('exportFps', 30)}
                  className={`chip-btn ${config.exportFps === 30 ? 'chip-active' : ''}`}
                >
                  ⚡ 30 FPS (Ultra Fast)
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig('exportFps', 60)}
                  className={`chip-btn ${(!config.exportFps || config.exportFps === 60) ? 'chip-active' : ''}`}
                >
                  🎬 60 FPS (Broadcast 60fps)
                </button>
              </div>
            </div>

            {/* Export Video Codec (H.265 / H.264) */}
            <div className="slider-group">
              <div className="slider-header">
                <label className="input-label">Export Video Codec</label>
              </div>
              <div className="chips-grid">
                <button
                  type="button"
                  onClick={() => updateConfig('codecPreference', 'h265')}
                  className={`chip-btn ${config.codecPreference === 'h265' ? 'chip-active' : ''}`}
                >
                  🚀 H.265 (HEVC Studio)
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig('codecPreference', 'h264')}
                  className={`chip-btn ${(!config.codecPreference || config.codecPreference === 'h264') ? 'chip-active' : ''}`}
                >
                  🎞️ H.264 (Main Profile Universal)
                </button>
              </div>
            </div>

            {/* Screen Shake Toggle */}
            <div className="toggle-row">
              <div>
                <label className="toggle-title">Screen Shake</label>
                <p className="toggle-desc">Adds impact camera vibration at hit frame</p>
              </div>
              <input
                type="checkbox"
                checked={config.enableShake !== false}
                onChange={(e) => updateConfig('enableShake', e.target.checked)}
                className="toggle-checkbox"
              />
            </div>
          </div>
        )}

        {/* TAB 4: AUDIO FX & CUSTOM AUDIO */}
        {activeTab === 'audio' && (
          <div className="tab-pane">
            {/* Audio Mode Selection */}
            <div className="input-group">
              <label className="input-label">Video Export Audio Mode</label>
              <div className="flex flex-col gap-2">
                <label className="audio-mode-option">
                  <input
                    type="radio"
                    name="audioMode"
                    checked={soundEnabled && !soundFX.customAudioBuffer}
                    onChange={() => {
                      soundFX.removeCustomAudio();
                      setSoundEnabled(true);
                    }}
                  />
                  <span>🔊 Synthesized Sound Effects (VFX)</span>
                </label>

                <label className="audio-mode-option">
                  <input
                    type="radio"
                    name="audioMode"
                    checked={soundEnabled && !!soundFX.customAudioBuffer}
                    onChange={() => setSoundEnabled(true)}
                  />
                  <span>📁 Custom Audio Track (Upload File)</span>
                </label>

                <label className="audio-mode-option">
                  <input
                    type="radio"
                    name="audioMode"
                    checked={!soundEnabled}
                    onChange={() => setSoundEnabled(false)}
                  />
                  <span>🔇 Mute / No Audio (Export Silent MP4)</span>
                </label>
              </div>
            </div>

            {/* Custom Audio File Upload Box */}
            {soundEnabled && (
              <div className="custom-audio-box">
                <label className="input-label">Upload Audio File (MP3, WAV, AAC)</label>
                
                <input
                  type="file"
                  accept="audio/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const success = await soundFX.loadCustomAudio(file);
                      if (success) {
                        setSoundEnabled(true);
                        // trigger re-render
                        setConfig((prev) => ({ ...prev }));
                      } else {
                        alert('Error loading custom audio file.');
                      }
                    }
                  }}
                  className="file-input-sm"
                />

                {soundFX.customAudioName && (
                  <div className="custom-audio-active-bar">
                    <span className="truncate">🎶 {soundFX.customAudioName}</span>
                    <button
                      onClick={() => {
                        soundFX.removeCustomAudio();
                        setConfig((prev) => ({ ...prev }));
                      }}
                      className="text-xs text-red-400 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Audio Test Box */}
            <div className="audio-test-box" style={{ marginTop: '1rem' }}>
              <div className="audio-test-info">
                <Zap size={24} className="text-amber-400" />
                <div>
                  <h4 className="font-bold text-white">Audio Playback Test</h4>
                  <p className="text-sm text-slate-400">
                    {soundFX.customAudioBuffer
                      ? `Custom File: ${soundFX.customAudioName}`
                      : soundEnabled
                      ? 'Impact synthesized SFX'
                      : 'Audio Muted'}
                  </p>
                </div>
              </div>

              <div className="audio-test-actions">
                <button
                  onClick={() => soundFX.playImpactBlock()}
                  disabled={!soundEnabled}
                  className="btn-secondary-sm"
                >
                  ▶️ Preview Sound
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
