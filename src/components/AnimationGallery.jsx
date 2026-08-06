import React, { useState } from 'react';
import { PRESET_CATEGORIES, PRESETS } from '../engine/canvasRenderers';
import { Sparkles, Zap, Trophy, User, Check } from 'lucide-react';

export default function AnimationGallery({ activePreset, onSelectPreset }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPresets = selectedCategory === 'all'
    ? PRESETS
    : PRESETS.filter((p) => p.category === selectedCategory);

  return (
    <div className="gallery-card">
      <div className="gallery-header">
        <div className="gallery-title-group">
          <Sparkles size={20} className="text-amber-400" />
          <h2 className="gallery-title">Volleyball Overlay & VFX Animation Library</h2>
        </div>

        {/* Category Filters */}
        <div className="category-tabs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`cat-tab ${selectedCategory === 'all' ? 'cat-active' : ''}`}
          >
            All ({PRESETS.length})
          </button>
          
          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`cat-tab ${selectedCategory === cat.id ? 'cat-active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="preset-grid">
        {filteredPresets.map((preset) => {
          const isActive = activePreset.id === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`preset-card ${isActive ? 'preset-card-active' : ''}`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="active-corner-badge">
                  <Check size={14} />
                  <span>ACTIVE</span>
                </div>
              )}

              {/* Preset Header */}
              <div className="preset-card-header">
                <div className="preset-icon-badge" style={{ backgroundColor: `${preset.primaryColor}22`, color: preset.primaryColor }}>
                  {preset.category === 'vfx' && <Zap size={22} />}
                  {preset.category === 'broadcast' && <Trophy size={22} />}
                  {preset.category === 'player' && <User size={22} />}
                </div>

                <div className="preset-titles">
                  <h3 className="preset-name">{preset.name}</h3>
                  <span className="preset-category-tag">{preset.category.toUpperCase()}</span>
                </div>
              </div>

              <p className="preset-desc">{preset.description}</p>

              {/* Swatch & Select Button */}
              <div className="preset-card-footer">
                <div className="mini-swatch">
                  <span style={{ backgroundColor: preset.primaryColor }}></span>
                  <span style={{ backgroundColor: preset.secondaryColor }}></span>
                </div>

                <button className={`btn-select ${isActive ? 'btn-select-active' : ''}`}>
                  {isActive ? 'Active Animation' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
