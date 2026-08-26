# 🇰 VolleyVFX Studio

Generatore broadcast di **overlay e animazioni VFX per pallavolo**: anteprima live su canvas, testo/colori personalizzabili, roster sincronizzato via Firebase ed export video frame-accurate pronto per Premiere, DaVinci, CapCut o OBS.

## Funzionalita

- **7 preset di animazione** riscritti da zero: Monster Block, Super Spike, Service Ace, Monster Save, Perfect Set, Set & Match Point Alert, Player Spotlight Card
- **Anteprima live** 1920x1080 (16:9) o 1080x1920 (9:16 verticale) con play/pausa, restart e timeline
- **Export video** frame-per-frame (non real-time) a 30 o 60 fps: HEVC/H.264 MP4 con fallback WebM VP9; MediaRecorder per browser legacy
- **Sfondi export**: Alpha (verde per keying), Green, Blue, Black
- **Testo libero + sub-badge** su una o due righe (nome / ruolo-numero), quick preset
- **Temi colore rapidi** e color picker primario/secondario/accento
- **Controlli effetti**: durata, intensita linee/bordi, screen shake broadcast deterministico
- **Audio**: sintetizzatore Web Audio (impact, spike swoosh, ace laser, score pop) oppure traccia personalizzata caricata dall utente
- **Firebase Auth** (Google + email/password) e **sincronizzazione roster in tempo reale** dal Realtime Database con fallback progressivo e roster demo offline

## Architettura

```
src/
main.jsx                 # Bootstrap React
App.jsx                  # Shell + orchestrazione stato/esportazione
index.css                # Design system (dark broadcast theme)
lib/presets.js           # Definizioni preset, temi, testi rapidi
engine/render.js         # Dispatcher frame + screen shake
engine/renderUtils.js    # PRNG deterministico, easing, badge, titolo
engine/effects/          # Un renderer per preset
engine/recorder.js       # WebCodecs+muxers / MediaRecorder export
engine/audio.js          # Motore SFX Web Audio
firebase/core.js         # Init, config storage, auth API
firebase/roster.js       # Sync roster/formazioni RTDB
firebase/firebase.js     # Barrel pubblico
components/              # Navbar, Previewer, Controls, Gallery,
                         # PlayerSelector, ExportModal, AuthModal
```

Nota: le animazioni usano un PRNG seedato sul frame (mulberry32), quindi **preview ed export producono pixel identici**.

## Script

```bash
npm run dev       # Dev server Vite
npm run build     # Build produzione (dist/)
npm run lint      # Oxlint
npm run preview   # Anteprima della build
npm run deploy    # Build + pubblicazione su GitHub Pages
```

## Configurazione Firebase

Le credenziali di default puntano al progetto `volley-hub-c90ca`. E possibile sostituirle via `.env` (`VITE_FIREBASE_API_KEY`, ecc. — vedi `.env.example`) oppure modificando `src/firebase/core.js`. Roster atteso sotto `users/{uid}/players` e/o `users/{uid}/formation`.
