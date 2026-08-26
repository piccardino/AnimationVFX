// Frame-accurate video export engine (WebCodecs + muxers, MediaRecorder fallback)
import * as WebMMuxer from 'webm-muxer';
import * as Mp4Muxer from 'mp4-muxer';

export async function exportCanvasToVideo({
  renderFrame,
  durationSeconds = 3.5,
  fps = 60,
  config,
  chromaBg = 'transparent',
  aspectRatio = '16:9',
  onProgress,
}) {
  const width = aspectRatio === '9:16' ? 1080 : 1920;
  const height = aspectRatio === '9:16' ? 1920 : 1080;

  // MP4 requires a solid background: transparent becomes green screen for NLE keying
  const bg = chromaBg === 'transparent' ? '#00ff00' : chromaBg;

  if (typeof window !== 'undefined' && 'VideoEncoder' in window) {
    try {
      return await encodeWithWebCodecs({ renderFrame, durationSeconds, fps, config, bg, width, height, onProgress });
    } catch (err) {
      console.warn('WebCodecs export failed, falling back to MediaRecorder:', err);
    }
  }
  return recordWithMediaRecorder({ renderFrame, durationSeconds, fps, config, bg, width, height, onProgress });
}

function makeFilename(config, ext) {
  const clean = config?.mainText ? config.mainText.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'clip';
  return `${config?.presetId || 'volley_overlay'}_${clean}.${ext}`;
}

function buildResult(blob, config, codecLabel, mimeType, bg) {
  const isMp4 = mimeType.includes('mp4');
  return {
    blob,
    videoUrl: URL.createObjectURL(blob),
    filename: makeFilename(config, isMp4 ? 'mp4' : 'webm'),
    isMp4,
    codecLabel,
    mimeType,
    exportBg: bg,
  };
}

async function pickEncoderCodec(candidates) {
  for (const candidate of candidates) {
    try {
      const support = await VideoEncoder.isConfigSupported(candidate);
      if (support.supported) return candidate;
    } catch { /* keep probing */ }
  }
  return null;
}

async function encodeWithWebCodecs({ renderFrame, durationSeconds, fps, config, bg, width, height, onProgress }) {
  const totalFrames = Math.max(1, Math.round(durationSeconds * fps));
  const frameDurationUs = Math.round(1_000_000 / fps);
  const bitrate = 12_000_000;

  // Prefer HEVC (best DaVinci/Premiere compat), then H.264 profiles, finally WebM VP9
  let chosen = await pickEncoderCodec([
    { codec: 'hev1.1.6.L120.B0', bitrate, framerate: fps, width, height },
    { codec: 'hvc1.1.6.L120.B0', bitrate, framerate: fps, width, height },
    { codec: 'avc1.640028', bitrate, framerate: fps, width, height },
    { codec: 'avc1.4d4028', bitrate, framerate: fps, width, height },
    { codec: 'avc1.42e01e', bitrate, framerate: fps, width, height },
  ]);
  let mode = chosen
    ? { kind: 'mp4', codecLabel: /^(hev|hvc)/.test(chosen.codec) ? 'MP4 (H.265/HEVC)' : 'MP4 (H.264)' }
    : null;

  if (!chosen) {
    chosen = await pickEncoderCodec([{ codec: 'vp09.00.10.08', bitrate, framerate: fps, width, height }]);
    if (!chosen) throw new Error('Nessun encoder video supportato dal browser');
    mode = { kind: 'webm', codecLabel: 'WebM (VP9)' };
  }

  const MuxerLib = mode.kind === 'mp4' ? Mp4Muxer : WebMMuxer;
  const target = new MuxerLib.ArrayBufferTarget();
  const muxerVideo = mode.kind === 'mp4'
    ? { codec: /^(hev|hvc)/.test(chosen.codec) ? 'hevc' : 'avc', width, height }
    : { codec: 'V_VP9', width, height, frameRate: fps };
  const muxer = new MuxerLib.Muxer({
    target,
    video: muxerVideo,
    ...(mode.kind === 'mp4' ? { fastStart: 'in-memory' } : {}),
  });

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('Encoder error:', e),
  });
  encoder.configure(chosen);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < totalFrames; i++) {
    const progress = (i + 1) / totalFrames;
    renderFrame(ctx, width, height, progress, config, bg);

    const frame = new VideoFrame(canvas, { timestamp: i * frameDurationUs, duration: frameDurationUs });
    encoder.encode(frame, { keyFrame: i % Math.max(1, fps) === 0 });
    frame.close();

    if (encoder.encodeQueueSize > 2) await new Promise((r) => setTimeout(r, 0));
    if (onProgress && (i % 3 === 0 || i === totalFrames - 1)) {
      onProgress(Math.min(99, Math.round(((i + 1) / totalFrames) * 100)));
    }
  }

  await encoder.flush();
  encoder.close();
  muxer.finalize();

  if (onProgress) onProgress(100);
  const blob = new Blob([target.buffer], { type: mode.kind === 'mp4' ? 'video/mp4' : 'video/webm' });
  return buildResult(blob, config, mode.codecLabel, blob.type, bg);
}

// Legacy fallback: real-time canvas capture via MediaRecorder
function recordWithMediaRecorder({ renderFrame, durationSeconds, fps, config, bg, width, height, onProgress }) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      const stream = new MediaStream([...canvas.captureStream(fps).getVideoTracks()]);
      const mimeCandidates = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => resolve(
        buildResult(new Blob(chunks, { type: mimeType }), config, mimeType.includes('mp4') ? 'MP4' : 'WebM', mimeType, bg)
      );

      recorder.start(100);
      const durationMs = durationSeconds * 1000;
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        renderFrame(ctx, width, height, progress, config, bg);
        onProgress?.(Math.floor(progress * 100));

        if (elapsed < durationMs) {
          requestAnimationFrame(step);
        } else {
          renderFrame(ctx, width, height, 1, config, bg);
          onProgress?.(100);
          setTimeout(() => {
            if (recorder.state !== 'inactive') recorder.stop();
          }, 100);
        }
      }
      requestAnimationFrame(step);
    } catch (err) {
      reject(err);
    }
  });
}
