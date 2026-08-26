// Live canvas viewport with playback controls, aspect switch and chroma background picker
import { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Download, MonitorPlay } from 'lucide-react';
import { renderCanvasFrame } from '../engine/render';
import { soundFX } from '../engine/audio';

const CHROMA_OPTIONS = [
  { id: 'transparent', label: 'Alpha', swatch: 'transparent' },
  { id: '#00ff00', label: 'Green', swatch: '#00ff00' },
  { id: '#0000ff', label: 'Blue', swatch: '#0044ff' },
  { id: '#000000', label: 'Black', swatch: '#111111' },
];

const IMPACT_WINDOW = [0.18, 0.3];

export default function AnimationPreviewer({
  config,
  chromaBg,
  setChromaBg,
  soundEnabled,
  aspectRatio,
  setAspectRatio,
  isExporting = false,
  onStartExport,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const soundFiredRef = useRef(false);

  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const duration = config.duration || 3.5;
  const width = aspectRatio === '9:16' ? 1080 : 1920;
  const height = aspectRatio === '9:16' ? 1920 : 1080;

  useEffect(() => {
    startRef.current = null;

    const loop = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      if (playing && !isExporting) {
        const elapsed = (timestamp - startRef.current) / 1000;
        const t = (elapsed % duration) / duration;

        if (t < 0.1) soundFiredRef.current = false;
        if (
          soundEnabled &&
          t >= IMPACT_WINDOW[0] &&
          t <= IMPACT_WINDOW[1] &&
          !soundFiredRef.current
        ) {
          soundFiredRef.current = true;
          soundFX.playForPreset(config.presetId);
        }

        setProgress(t);
        const canvas = canvasRef.current;
        if (canvas) {
          renderCanvasFrame(canvas.getContext('2d'), canvas.width, canvas.height, t, config, chromaBg);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, isExporting, config, chromaBg, duration, soundEnabled]);

  const restart = () => {
    startRef.current = null;
    soundFiredRef.current = false;
    setProgress(0);
    setPlaying(true);
  };

  return (
    <div className="previewer">
      <header className="previewer__head">
        <div className="previewer__title">
          <MonitorPlay size={17} />
          <span>Anteprima Live</span>
          <small>
            {width}×{height}
          </small>
        </div>

        <select
          value={aspectRatio}
          onChange={(e) => {
            restart();
            setAspectRatio(e.target.value);
          }}
          className="select"
        >
          <option value="16:9">16:9 Orizzontale (YouTube)</option>
          <option value="9:16">9:16 Verticale (TikTok / Reels)</option>
        </select>
      </header>

      <div className={`viewport ${aspectRatio === '9:16' ? 'viewport--vertical' : 'viewport--horizontal'}`}>
        {/* Checkerboard reveals the alpha channel when transparent */}
        <div className="viewport__checker" />
        <canvas ref={canvasRef} width={width} height={height} className="viewport__canvas" />
        <div className="timeline">
          <div className="timeline__fill" style={{ width: `${(progress * 100).toFixed(1)}%` }} />
        </div>
      </div>

      <footer className="previewer__foot">
        <div className="playback">
          <button onClick={() => setPlaying((p) => !p)} className="btn-icon btn-icon--big" aria-label="Play/Pausa">
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={restart} className="btn-icon" title="Riavvia animazione">
            <RotateCcw size={16} />
          </button>
          <span className="playback__time">
            {(progress * duration).toFixed(1)}s / {duration.toFixed(1)}s
          </span>
        </div>

        <div className="chroma">
          <span>Sfondo:</span>
          {CHROMA_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setChromaBg(opt.id)}
              className={`chroma-btn ${chromaBg === opt.id ? 'chroma-btn--selected' : ''}`}
              style={{ '--swatch': opt.swatch }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button onClick={onStartExport} disabled={isExporting} className="btn btn--export">
          <Download size={17} />
          Esporta video ({duration}s)
        </button>
      </footer>
    </div>
  );
}
