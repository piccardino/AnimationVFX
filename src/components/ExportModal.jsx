import React from 'react';
import { X, Download, CheckCircle, Video, Loader2, Sparkles, HelpCircle } from 'lucide-react';

export default function ExportModal({
  isOpen,
  onClose,
  isExporting,
  exportProgress,
  exportResult,
}) {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!exportResult) return;
    const a = document.createElement('a');
    a.href = exportResult.videoUrl;
    a.download = exportResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Video size={22} className="text-cyan-400" />
            <h3>Export Video Overlay Clip</h3>
          </div>
          {!isExporting && (
            <button onClick={onClose} className="modal-close-btn">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* STATE 1: RENDERING & RECORDING */}
          {isExporting && (
            <div className="export-status-box">
              <Loader2 size={48} className="animate-spin text-cyan-400 mb-4" />
              <h4 className="export-heading">Recording Canvas at 60 FPS...</h4>
              <p className="export-subtext">Generating MP4 video file</p>

              {/* Progress Bar */}
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <span className="progress-percentage">{exportProgress}% completed</span>
            </div>
          )}

          {/* STATE 2: EXPORT COMPLETE */}
          {!isExporting && exportResult && (
            <div className="export-success-box">
              <div className="success-badge">
                <CheckCircle size={28} className="text-emerald-400" />
                <span>Video Successfully Generated!</span>
              </div>

              {/* Recorded Video Preview Player */}
              <div className="recorded-video-container">
                <video
                  src={exportResult.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="recorded-video-player"
                />
              </div>

              {/* Video Info Meta */}
              <div className="video-meta-bar">
                <span className="meta-item">📁 File: {exportResult.filename}</span>
                <span className="meta-item">🎞️ Format: {exportResult.codecLabel || (exportResult.isMp4 ? 'MP4 (H.264)' : 'WebM HD')}</span>
                <span className="meta-item">⚡ 60 FPS Broadcast Quality</span>
              </div>

              {/* Main Download Button */}
              <button onClick={handleDownload} className="btn-download-large">
                <Download size={22} />
                <span>Download {exportResult.isMp4 ? 'MP4' : 'WebM'} Video Now</span>
              </button>

              {/* Instructions Box for Editors */}
              <div className="editing-tips-box">
                <div className="tips-header">
                  <HelpCircle size={16} className="text-cyan-400" />
                  <span>How to Use in Video Editing Software (Premiere, DaVinci, CapCut, OBS)</span>
                </div>
                <ul className="tips-list">
                  <li>1. Import the recorded clip into a video track above your match footage.</li>
                  <li>2. If you selected <b>Green Screen</b>, apply <i>Ultra Key</i> or <i>Chroma Key</i> effect to remove the green background with 1 click.</li>
                  <li>3. If background is <b>Black</b>, set the blending mode of the clip to <i>Screen</i> or <i>Add</i>.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
