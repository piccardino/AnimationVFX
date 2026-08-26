// Export result modal: progress state, preview player, download & editing tips
import { X, Download, CheckCircle2, Loader2, Film, HelpCircle } from 'lucide-react';

function download(result) {
  const a = document.createElement('a');
  a.href = result.videoUrl;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function ExportModal({ isOpen, onClose, isExporting, exportProgress, exportResult }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={!isExporting ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <h3>
            <Film size={19} /> Esportazione Clip Video
          </h3>
          {!isExporting && (
            <button onClick={onClose} className="modal__close" aria-label="Chiudi">
              <X size={18} />
            </button>
          )}
        </header>

        {isExporting ? (
          <div className="modal__state">
            <Loader2 size={44} className="spin" />
            <h4>Rendering frame-accurate in corso…</h4>
            <p>Generazione del file video broadcast</p>
            <div className="progress">
              <div className="progress__fill" style={{ width: `${exportProgress}%` }} />
            </div>
            <span>{exportProgress}%</span>
          </div>
        ) : exportResult ? (
          <div className="modal__state modal__state--done">
            <p className="done-badge">
              <CheckCircle2 size={20} /> Video generato con successo!
            </p>

            <video src={exportResult.videoUrl} controls autoPlay loop muted className="modal__video" />

            <ul className="meta">
              <li>📁 {exportResult.filename}</li>
              <li>🎞️ {exportResult.codecLabel || (exportResult.isMp4 ? 'MP4' : 'WebM')}</li>
            </ul>

            <button onClick={() => download(exportResult)} className="btn btn--primary btn--full">
              <Download size={19} />
              Scarica {exportResult.isMp4 ? 'MP4' : 'WebM'}
            </button>

            <details className="tips">
              <summary>
                <HelpCircle size={14} /> Come usarlo nel software di montaggio
              </summary>
              <ol>
                <li>Importa la clip su una traccia sopra le immagini della partita.</li>
                <li>
                  Con <b>Green/Blue screen</b> applica l’effetto <i>Chroma Key</i> o <i>Ultra Key</i>.
                </li>
                <li>
                  Con sfondo <b>Nero</b> imposta la modalità di fusione su <i>Screen</i> o <i>Add</i>.
                </li>
                <li>
                  Scegli <b>Alpha</b> per una base verde pronta per il keying (MP4 non supporta trasparenza).
                </li>
              </ol>
            </details>
          </div>
        ) : null}
      </div>
    </div>
  );
}
