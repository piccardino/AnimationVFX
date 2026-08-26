// VolleyVFX Studio — application shell & state orchestration
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AnimationPreviewer from './components/AnimationPreviewer';
import ControlsPanel from './components/ControlsPanel';
import AnimationGallery from './components/AnimationGallery';
import ExportModal from './components/ExportModal';
import FirebaseAuthModal from './components/FirebaseAuthModal';
import { PRESETS, buildInitialConfig, getPresetById } from './lib/presets';
import { renderCanvasFrame } from './engine/render';
import { exportCanvasToVideo } from './engine/recorder';
import { subscribeToAuth, logout } from './firebase/firebase';

export default function App() {
  const [config, setConfig] = useState(buildInitialConfig);
  const [chromaBg, setChromaBg] = useState('transparent');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  const [exportState, setExportState] = useState({
    open: false,
    busy: false,
    progress: 0,
    result: null,
  });

  useEffect(() => subscribeToAuth(setUser), []);

  const activePreset = getPresetById(config.presetId);

  const selectPreset = (preset) =>
    setConfig((prev) => {
      const sel = prev.selectedPlayer;
      let mainText = preset.defaultMainText;
      let subText = preset.defaultSubText;
      let primaryColor = preset.primaryColor;
      let secondaryColor = preset.secondaryColor;

      if (preset.id === 'player_card' && sel) {
        mainText = sel.name;
        subText = `${sel.number ? `#${sel.number} • ` : ''}${sel.role}`;
      }
      if (sel?.primaryColor && preset.id === 'player_card') primaryColor = sel.primaryColor;
      if (sel?.secondaryColor && preset.id === 'player_card') secondaryColor = sel.secondaryColor;

      return {
        ...prev,
        presetId: preset.id,
        mainText,
        subText,
        primaryColor,
        secondaryColor,
        accentColor: preset.accentColor,
        duration: preset.duration,
      };
    });

  const startExport = async () => {
    setExportState({ open: true, busy: true, progress: 0, result: null });
    try {
      const result = await exportCanvasToVideo({
        renderFrame: renderCanvasFrame,
        durationSeconds: config.duration || 3.5,
        fps: config.exportFps || 60,
        config,
        chromaBg,
        aspectRatio,
        onProgress: (progress) =>
          setExportState((s) => ({ ...s, progress })),
      });
      setExportState({ open: true, busy: false, progress: 100, result });
    } catch (err) {
      console.error('Export error:', err);
      setExportState((s) => ({ ...s, open: false, busy: false }));
      alert('Errore durante l’esportazione video: ' + err.message);
    }
  };

  const closeExport = () => {
    if (exportState.result?.videoUrl) URL.revokeObjectURL(exportState.result.videoUrl);
    setExportState({ open: false, busy: false, progress: 0, result: null });
  };

  return (
    <div className="app">
      <Navbar
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        activePreset={activePreset}
        onQuickExport={startExport}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={async () => {
          await logout();
          setUser(null);
        }}
      />

      <main className="layout">
        <div className="layout__workspace">
          <AnimationPreviewer
            config={config}
            chromaBg={chromaBg}
            setChromaBg={setChromaBg}
            soundEnabled={soundEnabled}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            onStartExport={startExport}
            isExporting={exportState.busy}
          />

          <ControlsPanel
            config={config}
            setConfig={setConfig}
            user={user}
            onOpenAuth={() => setAuthOpen(true)}
          />
        </div>

        <AnimationGallery activePreset={activePreset} onSelectPreset={selectPreset} />
      </main>

      <ExportModal
        isOpen={exportState.open}
        onClose={closeExport}
        isExporting={exportState.busy}
        exportProgress={exportState.progress}
        exportResult={exportState.result}
      />

      <FirebaseAuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        user={user}
        onAuthChange={setUser}
      />
    </div>
  );
}

// Re-exported for tests/tools that rely on the legacy module path
export { PRESETS };
