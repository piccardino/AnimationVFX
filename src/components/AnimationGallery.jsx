// Preset library gallery with category filters
import { useState } from 'react';
import { PRESET_CATEGORIES, PRESETS } from '../lib/presets';
import { Zap, UserRound, Check } from 'lucide-react';

export default function AnimationGallery({ activePreset, onSelectPreset }) {
  const [category, setCategory] = useState('all');

  const visible =
    category === 'all' ? PRESETS : PRESETS.filter((p) => p.category === category);

  return (
    <section className="gallery">
      <header className="gallery__header">
        <h2>Libreria Animazioni & VFX</h2>
        <div className="gallery__filters">
          <button
            onClick={() => setCategory('all')}
            className={`chip ${category === 'all' ? 'chip--active' : ''}`}
          >
            Tutti ({PRESETS.length})
          </button>
          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`chip ${category === cat.id ? 'chip--active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      <div className="gallery__grid">
        {visible.map((preset) => {
          const isActive = activePreset.id === preset.id;
          return (
            <article
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`preset-card ${isActive ? 'preset-card--active' : ''}`}
            >
              {isActive && (
                <span className="preset-card__badge">
                  <Check size={12} /> ATTIVO
                </span>
              )}

              <div className="preset-card__head">
                <span
                  className="preset-card__icon"
                  style={{
                    background: `linear-gradient(135deg, ${preset.primaryColor}33, ${preset.secondaryColor}33)`,
                    color: preset.primaryColor,
                    boxShadow: `0 0 14px ${preset.primaryColor}44`,
                  }}
                >
                  {preset.category === 'player' ? <UserRound size={20} /> : <Zap size={20} />}
                </span>
                <div>
                  <h3>{preset.name}</h3>
                  <small style={{ color: preset.secondaryColor }}>
                    {preset.category.toUpperCase()} • {preset.duration}s
                  </small>
                </div>
              </div>

              <p className="preset-card__desc">{preset.description}</p>

              <footer className="preset-card__footer">
                <span className="swatch-pair">
                  <i style={{ background: preset.primaryColor }} />
                  <i style={{ background: preset.secondaryColor }} />
                </span>
                <span className={`btn btn--tiny ${isActive ? 'btn--primary' : 'btn--ghost'}`}>
                  {isActive ? 'In uso' : 'Seleziona'}
                </span>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
