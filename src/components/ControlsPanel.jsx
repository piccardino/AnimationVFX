// Right-hand customization panel: text, colors, effects & audio tabs
import { useState } from 'react';
import { Type, Palette, SlidersHorizontal, Volume2 } from 'lucide-react';
import { soundFX } from '../engine/audio';
import { COLOR_THEMES, QUICK_TEXT_PRESETS } from '../lib/presets';
import PlayerFirebaseSelector from './PlayerFirebaseSelector';

const TABS = [
  { id: 'text', label: 'Testo', Icon: Type },
  { id: 'colors', label: 'Colori', Icon: Palette },
  { id: 'effects', label: 'Effetti', Icon: SlidersHorizontal },
  { id: 'audio', label: 'Audio', Icon: Volume2 },
];

const COLOR_FIELDS = [
  ['primaryColor', 'Colore primario'],
  ['secondaryColor', 'Colore secondario'],
  ['accentColor', 'Colore accento'],
];

export default function ControlsPanel({ config, setConfig, user, onOpenAuth }) {
  const [tab, setTab] = useState('text');

  const update = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const applyTheme = (theme) =>
    setConfig((prev) => ({
      ...prev,
      primaryColor: theme.primary,
      secondaryColor: theme.secondary,
      accentColor: theme.accent,
    }));

  const handlePlayerSelect = ({ name, number, role, primaryColor, secondaryColor }) => {
    const pNum = number != null ? String(number) : '';
    const prefix = pNum ? `#${pNum} • ` : '';
    setConfig((prev) => ({
      ...prev,
      selectedPlayer: { name, number: pNum, role },
      mainText: prev.presetId === 'player_card' ? name : prev.mainText,
      subText:
        prev.presetId === 'player_card' ? `${prefix}${role}` : `${name}\n${prefix}${role}`,
      primaryColor: primaryColor || prev.primaryColor,
      secondaryColor: secondaryColor || prev.secondaryColor,
    }));
  };

  return (
    <aside className="controls">
      <nav className="controls__tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`tab ${tab === id ? 'tab--active' : ''}`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'text' && (
        <div className="controls__body">
          <label className="field">
            <span>Testo principale</span>
            <input
              type="text"
              className="input"
              value={config.mainText}
              onChange={(e) => update('mainText', e.target.value)}
              placeholder="MONSTER BLOCK"
            />
          </label>

          <div className="quick-texts">
            {QUICK_TEXT_PRESETS.map((text) => (
              <button key={text} onClick={() => update('mainText', text)} className="chip chip--tiny">
                {text}
              </button>
            ))}
          </div>

          <label className="field">
            <span>Sottotitolo (usa invio per 2 righe)</span>
            <textarea
              className="input input--area"
              rows={2}
              value={config.subText}
              onChange={(e) => update('subText', e.target.value.replace(/\n+/g, '\n'))}
              placeholder="#7 • OUTSIDE HITTER"
            />
          </label>

          <h4 className="controls__section-title">Roster dalla partita</h4>
          <PlayerFirebaseSelector
            user={user}
            onSelectPlayer={handlePlayerSelect}
            onOpenAuth={onOpenAuth}
          />
        </div>
      )}

      {tab === 'colors' && (
        <div className="controls__body">
          <h4 className="controls__section-title">Temi rapidi</h4>
          <div className="theme-grid">
            {COLOR_THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => applyTheme(theme)}
                className="theme-swatch"
                title={theme.name}
                style={{ background: `linear-gradient(120deg, ${theme.primary}, ${theme.secondary})` }}
              >
                <span>{theme.name}</span>
              </button>
            ))}
          </div>

          {COLOR_FIELDS.map(([key, label]) => (
            <label key={key} className="field field--row">
              <span>{label}</span>
              <input type="color" value={config[key]} onChange={(e) => update(key, e.target.value)} />
            </label>
          ))}
        </div>
      )}

      {tab === 'effects' && (
        <div className="controls__body">
          <label className="field">
            <span>Durata animazione: {Number(config.duration).toFixed(1)}s</span>
            <input
              type="range"
              min="1.5"
              max="8"
              step="0.1"
              value={config.duration}
              onChange={(e) => update('duration', Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Intensità linee/bordi</span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={config.lineThickness}
              onChange={(e) => update('lineThickness', Number(e.target.value))}
            />
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={config.enableShake !== false}
              onChange={(e) => update('enableShake', e.target.checked)}
            />
            <span>Screen shake broadcast all’impatto</span>
          </label>

          <label className="field">
            <span>FPS export</span>
            <select
              className="select"
              value={config.exportFps}
              onChange={(e) => update('exportFps', Number(e.target.value))}
            >
              <option value={30}>30 fps</option>
              <option value={60}>60 fps (broadcast)</option>
            </select>
          </label>
        </div>
      )}

      {tab === 'audio' && (
        <div className="controls__body">
          <div className="audio-modes">
            {[
              ['synth', !soundFX.hasCustom && soundFX.enabled, () => { soundFX.setEnabled(true); refreshTick(update); }, 'Sintetizzatore integrato'],
              ['custom', soundFX.enabled && soundFX.hasCustom, () => { soundFX.setEnabled(true); refreshTick(update); }, 'Traccia audio personalizzata'],
              ['mute', !soundFX.enabled, () => { soundFX.setEnabled(false); refreshTick(update); }, 'Muto / export senza audio'],
            ].map(([id, checked, onChange, label]) => (
              <label key={id} className="toggle-row">
                <input type="radio" name="audioMode" checked={checked} onChange={onChange} />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {soundFX.enabled && (
            <label className="field">
              <span>Carica file audio (MP3, WAV, AAC)</span>
              <input
                type="file"
                accept="audio/*"
                className="input input--file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const ok = await soundFX.loadCustom(file);
                  if (!ok) alert('Errore durante il caricamento del file audio.');
                  refreshTick(update);
                }}
              />
            </label>
          )}

          {soundFX.hasCustom && (
            <div className="audio-active">
              🎶 {soundFX.fileName}
              <button onClick={() => { soundFX.removeCustom(); refreshTick(update); }}>Rimuovi</button>
            </div>
          )}

          <button
            onClick={() => soundFX.playForPreset(config.presetId)}
            disabled={!soundFX.enabled}
            className="btn btn--ghost btn--full"
          >
            ▶ Anteprima suono
          </button>
        </div>
      )}
</aside>
  );
}

function refreshTick(update) {
  update('_forceRender', Date.now());
}
