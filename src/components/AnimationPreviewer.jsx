import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Eye, EyeOff, Monitor, Maximize2, Sparkles, Volume2 } from 'lucide-react';
import { renderCanvasFrame } from '../engine/canvasRenderers';
import { soundFX } from '../engine/soundEffects';

export default function AnimationPreviewer({
  config,
  chromaBg,
  setChromaBg,
  soundEnabled,
  onStartExport,
  aspectRatio = '16:9',
  setAspectRatio,
  isExporting = false,
}) {
  const canvasRef = useRef(null);
  const animReqRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showVideoBg, setShowVideoBg] = useState(false);
  const soundPlayedRef = useRef(false);

  const duration = config.duration || 3.5;

  // Animation Loop Effect
  useEffect(() => {
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      
      if (isPlaying && !isExporting) {
        const elapsed = (timestamp - startTime) / 1000;
        let currentProg = (elapsed % duration) / duration;

        // Reset sound trigger on loop start
        if (currentProg < 0.1 && soundPlayedRef.current) {
          soundPlayedRef.current = false;
        }

        // Trigger sound FX near impact frame (t ~ 0.2)
        if (soundEnabled && currentProg >= 0.18 && currentProg <= 0.3 && !soundPlayedRef.current) {
          soundPlayedRef.current = true;
          if (config.presetId === 'monster_block') soundFX.playImpactBlock();
          else if (config.presetId === 'super_spike') soundFX.playSuperSpike();
          else if (config.presetId === 'service_ace') soundFX.playAceLaser();
          else soundFX.playImpactBlock();
        }

        setProgress(currentProg);

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          renderCanvasFrame(ctx, canvas.width, canvas.height, currentProg, config, chromaBg);
        }
      }

      animReqRef.current = requestAnimationFrame(animate);
    };

    animReqRef.current = requestAnimationFrame(animate);

    return () => {
      if (animReqRef.current) cancelAnimationFrame(animReqRef.current);
    };
  }, [isPlaying, isExporting, config, chromaBg, duration, soundEnabled]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setProgress(0);
    soundPlayedRef.current = false;
    setIsPlaying(true);
  };

  return (
    <div className="previewer-card">
      {/* Viewport Header */}
      <div className="previewer-header">
        <div className="previewer-title">
          <Monitor size={18} className="text-cyan-400" />
          <span>Live Overlay Preview</span>
          <span className="resolution-tag">1920 x 1080 (HD)</span>
        </div>

        {/* Aspect Ratio Selector & Video Toggle */}
        <div className="previewer-actions">
          <button
            onClick={() => setShowVideoBg(!showVideoBg)}
            className={`btn-secondary-sm ${showVideoBg ? 'btn-active' : ''}`}
            title="Toggle Volleyball Match Video Background"
          >
            {showVideoBg ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{showVideoBg ? 'Match BG ON' : 'Match BG OFF'}</span>
          </button>

          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="select-sm"
          >
            <option value="16:9">16:9 Landscape (TV / YouTube)</option>
            <option value="9:16">9:16 Vertical (TikTok / Reels)</option>
          </select>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className={`viewport-container ${aspectRatio === '9:16' ? 'aspect-vertical' : 'aspect-horizontal'}`}>
        {/* Volleyball Match Background Mockup */}
        {showVideoBg && chromaBg === 'transparent' && (
          <div className="match-video-mockup">
            <div className="court-floor"></div>
            <div className="volleyball-net"></div>
            <div className="player-silhouette player-1">🏐</div>
            <div className="player-silhouette player-2">🙋‍♂️</div>
            <div className="live-match-badge">
              <span className="live-dot"></span> LIVE MATCH CAM
            </div>
          </div>
        )}

        {/* Live Canvas */}
        <canvas
          ref={canvasRef}
          width={aspectRatio === '9:16' ? 1080 : 1920}
          height={aspectRatio === '9:16' ? 1920 : 1080}
          className="overlay-canvas"
        />

        {/* Timeline Overlay Bar */}
        <div className="timeline-bar-container">
          <div
            className="timeline-progress"
            style={{ width: `${(progress * 100).toFixed(1)}%` }}
          />
        </div>
      </div>

      {/* Playback Controls & Chroma Selector */}
      <div className="previewer-footer">
        {/* Playback Buttons */}
        <div className="playback-controls">
          <button onClick={handlePlayPause} className="btn-icon-md">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button onClick={handleRestart} className="btn-icon-md" title="Restart Animation">
            <RotateCcw size={18} />
          </button>

          <span className="time-display">
            {(progress * duration).toFixed(1)}s / {duration.toFixed(1)}s
          </span>
        </div>

        {/* Chroma Key Background Colors */}
        <div className="chroma-selector-group">
          <span className="chroma-label">Export Background:</span>
          
          <button
            onClick={() => setChromaBg('transparent')}
            className={`chroma-btn transparent-btn ${chromaBg === 'transparent' ? 'selected' : ''}`}
            title="Transparent Background"
          >
            🏁 Alpha
          </button>

          <button
            onClick={() => setChromaBg('#00ff00')}
            className={`chroma-btn green-btn ${chromaBg === '#00ff00' ? 'selected' : ''}`}
            title="Green Screen (Chroma Key)"
          >
            🟢 Green
          </button>

          <button
            onClick={() => setChromaBg('#0000ff')}
            className={`chroma-btn blue-btn ${chromaBg === '#0000ff' ? 'selected' : ''}`}
            title="Blue Screen (Chroma Key)"
          >
            🔵 Blue
          </button>

          <button
            onClick={() => setChromaBg('#000000')}
            className={`chroma-btn black-btn ${chromaBg === '#000000' ? 'selected' : ''}`}
            title="Black Background (Blend Mode)"
          >
            ⚫ Black
          </button>
        </div>

        {/* Export Button */}
        <button onClick={onStartExport} className="btn-export">
          <Download size={18} />
          <span>Export MP4 ({duration}s)</span>
        </button>
      </div>
    </div>
  );
}
