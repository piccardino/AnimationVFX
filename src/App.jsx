import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AnimationPreviewer from './components/AnimationPreviewer';
import ControlsPanel from './components/ControlsPanel';
import AnimationGallery from './components/AnimationGallery';
import ExportModal from './components/ExportModal';
import FirebaseAuthModal from './components/FirebaseAuthModal';
import { PRESETS, renderCanvasFrame } from './engine/canvasRenderers';
import { exportCanvasToVideo } from './engine/recorder';
import { soundFX } from './engine/soundEffects';
import { subscribeToAuth, logout } from './firebase/firebase';

export default function App() {
  const [activePreset, setActivePreset] = useState(PRESETS[0]);
  const [config, setConfig] = useState({
    presetId: PRESETS[0].id,
    mainText: PRESETS[0].defaultMainText,
    subText: PRESETS[0].defaultSubText,
    primaryColor: PRESETS[0].primaryColor,
    secondaryColor: PRESETS[0].secondaryColor,
    accentColor: PRESETS[0].accentColor,
    duration: PRESETS[0].duration,
    lineThickness: 0.8,
    exportFps: 60,
    enableShake: true,
  });

  const [chromaBg, setChromaBg] = useState('transparent');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Firebase Auth State
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  // Export Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState(null);

  // Handle Preset Change
  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    setConfig((prev) => {
      const isPlayerCard = preset.id === 'player_card';
      const sel = prev.selectedPlayer;

      let newMainText = preset.defaultMainText;
      let newSubText = preset.defaultSubText;
      let newPrimaryColor = preset.primaryColor;
      let newSecondaryColor = preset.secondaryColor;

      if (isPlayerCard && sel) {
        newMainText = sel.name;
        newSubText = `#${sel.number} • ${sel.role}`;
        if (sel.primaryColor) newPrimaryColor = sel.primaryColor;
        if (sel.secondaryColor) newSecondaryColor = sel.secondaryColor;
      }

      return {
        ...prev,
        presetId: preset.id,
        mainText: newMainText,
        subText: newSubText,
        primaryColor: newPrimaryColor,
        secondaryColor: newSecondaryColor,
        accentColor: preset.accentColor,
        duration: preset.duration,
      };
    });
  };

  // Trigger Video MP4 Export
  const handleStartExport = async () => {
    const canvas = document.querySelector('.overlay-canvas');

    setIsModalOpen(true);
    setIsExporting(true);
    setExportProgress(0);
    setExportResult(null);

    try {
      const result = await exportCanvasToVideo({
        canvas,
        renderFrame: renderCanvasFrame,
        durationSeconds: config.duration || 3.5,
        fps: config.exportFps || 60,
        config,
        chromaBg,
        aspectRatio,
        onProgress: (pct) => setExportProgress(pct),
      });

      setExportResult(result);
      setIsExporting(false);
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
      alert('Si è verificato un errore durante l esportazione MP4: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        activePreset={activePreset}
        onQuickExport={handleStartExport}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Dashboard */}
      <main className="main-content">
        <div className="workspace-grid">
          {/* Left Column: Live Canvas Viewport */}
          <div className="left-column">
            <AnimationPreviewer
              config={config}
              chromaBg={chromaBg}
              setChromaBg={setChromaBg}
              soundEnabled={soundEnabled}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              isExporting={isExporting}
              onStartExport={handleStartExport}
            />
          </div>

          {/* Right Column: Customization Panel */}
          <div className="right-column">
            <ControlsPanel
              config={config}
              setConfig={setConfig}
              user={user}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          </div>
        </div>

        {/* Bottom Section: Animation Gallery */}
        <section className="gallery-section">
          <AnimationGallery
            activePreset={activePreset}
            onSelectPreset={handleSelectPreset}
          />
        </section>
      </main>

      {/* MP4 Export Modal */}
      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isExporting={isExporting}
        exportProgress={exportProgress}
        exportResult={exportResult}
      />

      {/* Firebase Auth Modal */}
      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onAuthChange={(u) => setUser(u)}
      />
    </div>
  );
}
