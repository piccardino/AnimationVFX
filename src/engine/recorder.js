// High-Performance Frame-Accurate Video Encoder Engine using WebCodecs & Muxers

import * as WebMMuxer from 'webm-muxer';
import * as Mp4Muxer from 'mp4-muxer';

export async function exportCanvasToVideo({
  renderFrame,
  durationSeconds = 3.5,
  fps = 30,
  config,
  chromaBg = 'transparent',
  aspectRatio = '16:9',
  onProgress,
}) {
  const exportWidth = aspectRatio === '9:16' ? 1080 : 1920;
  const exportHeight = aspectRatio === '9:16' ? 1920 : 1080;
  
  // DaVinci Resolve & Windows NLE compatibility: MP4 format requires a solid background (#00ff00 Green Screen by default for transparent)
  const isAlphaRequested = chromaBg === 'transparent';
  const exportBg = isAlphaRequested ? '#00ff00' : chromaBg;

  // Check if WebCodecs VideoEncoder is supported by current browser
  const hasWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window;

  if (hasWebCodecs) {
    try {
      return await exportWithWebCodecs({
        renderFrame,
        durationSeconds,
        fps,
        config,
        exportBg,
        exportWidth,
        exportHeight,
        onProgress,
        isAlphaRequested,
      });
    } catch (err) {
      console.warn('WebCodecs export failed, falling back to MediaRecorder:', err);
    }
  }

  // Fallback for older browsers without WebCodecs
  return exportWithMediaRecorder({
    renderFrame,
    durationSeconds,
    fps,
    config,
    exportBg,
    exportWidth,
    exportHeight,
    onProgress,
  });
}

// 1. WebCodecs (VideoEncoder + Muxer) Frame-by-Frame Recording Engine
async function exportWithWebCodecs({
  renderFrame,
  durationSeconds,
  fps = 30,
  config,
  exportBg,
  exportWidth,
  exportHeight,
  onProgress,
  isAlphaRequested = false,
}) {
  const totalFrames = Math.max(1, Math.floor(durationSeconds * fps));
  const frameDurationUs = Math.round(1_000_000 / fps); // Microseconds per frame

  let isMp4 = false;
  let muxer = null;
  let encoder = null;
  let codecLabel = 'H.264';

  // Candidate codec list prioritizing H.265 (HEVC with valid .B0 tier bytes) and H.264 Main/High profiles
  const hevcList = [
    { codec: 'hev1.1.6.L120.B0', muxerCodec: 'hevc', isHevc: true, label: 'MP4 (H.265 / HEVC)' },
    { codec: 'hvc1.1.6.L120.B0', muxerCodec: 'hevc', isHevc: true, label: 'MP4 (H.265 / HEVC)' },
    { codec: 'hev1.1.6.L93.B0',  muxerCodec: 'hevc', isHevc: true, label: 'MP4 (H.265 / HEVC)' },
    { codec: 'hvc1.1.6.L93.B0',  muxerCodec: 'hevc', isHevc: true, label: 'MP4 (H.265 / HEVC)' },
    { codec: 'hev1.1.6.L150.B0', muxerCodec: 'hevc', isHevc: true, label: 'MP4 (H.265 / HEVC)' },
    { codec: 'hvc1.1.6.L150.B0', muxerCodec: 'hevc', isHevc: true, label: 'MP4 (H.265 / HEVC)' },
  ];

  const h264List = [
    { codec: 'avc1.4d402a', muxerCodec: 'avc', isHevc: false, label: 'MP4 (H.264 Main Profile)' },
    { codec: 'avc1.4d4028', muxerCodec: 'avc', isHevc: false, label: 'MP4 (H.264 Main Profile)' },
    { codec: 'avc1.4d401f', muxerCodec: 'avc', isHevc: false, label: 'MP4 (H.264 Main Profile)' },
    { codec: 'avc1.64002a', muxerCodec: 'avc', isHevc: false, label: 'MP4 (H.264 High Profile)' },
    { codec: 'avc1.640028', muxerCodec: 'avc', isHevc: false, label: 'MP4 (H.264 High Profile)' },
    { codec: 'avc1.64001f', muxerCodec: 'avc', isHevc: false, label: 'MP4 (H.264 High Profile)' },
    { codec: 'avc1.42e028', muxerCodec: 'avc', isHevc: false, label: 'MP4 (H.264 Baseline)' },
  ];

  let codecCandidates = [];
  if (config.codecPreference === 'h265') {
    codecCandidates = [...hevcList, ...h264List];
  } else {
    codecCandidates = [...h264List, ...hevcList];
  }

  try {
    let chosenCandidate = null;
    for (const cand of codecCandidates) {
      try {
        const testConfig = {
          codec: cand.codec,
          width: exportWidth,
          height: exportHeight,
          bitrate: 12_000_000,
          framerate: fps,
        };
        const check = await VideoEncoder.isConfigSupported(testConfig);
        if (check && check.supported) {
          chosenCandidate = cand;
          break;
        }
      } catch (e) {
        // continue search
      }
    }

    if (chosenCandidate) {
      isMp4 = true;
      codecLabel = chosenCandidate.label;

      muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: {
          codec: chosenCandidate.muxerCodec,
          width: exportWidth,
          height: exportHeight,
        },
        fastStart: 'in-memory',
      });

      encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('VideoEncoder MP4 error:', e),
      });

      const encConfig = {
        codec: chosenCandidate.codec,
        width: exportWidth,
        height: exportHeight,
        bitrate: 12_000_000,
        framerate: fps,
      };

      encoder.configure(encConfig);
    }
  } catch (e) {
    console.warn('MP4 Encoder setup failed:', e);
    isMp4 = false;
  }

  // Fallback to WebM (VP9) if MP4 not supported by browser
  if (!isMp4) {
    muxer = new WebMMuxer.Muxer({
      target: new WebMMuxer.ArrayBufferTarget(),
      video: {
        codec: 'V_VP9',
        width: exportWidth,
        height: exportHeight,
        frameRate: fps,
        alpha: isAlphaRequested,
      },
    });

    encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('VideoEncoder WebM error:', e),
    });

    encoder.configure({
      codec: 'vp09.00.10.08',
      width: exportWidth,
      height: exportHeight,
      bitrate: 10_000_000,
      framerate: fps,
      alpha: isAlphaRequested ? 'keep' : 'discard',
    });
  }

  // Create isolated canvas for frame rendering
  const recCanvas = document.createElement('canvas');
  recCanvas.width = exportWidth;
  recCanvas.height = exportHeight;
  const ctx = recCanvas.getContext('2d');

  // Render every frame sequentially with high performance
  for (let frame = 0; frame < totalFrames; frame++) {
    const progress = frame / totalFrames;
    renderFrame(ctx, exportWidth, exportHeight, progress, config, exportBg);

    const timestampUs = Math.round(frame * frameDurationUs);
    const videoFrame = new VideoFrame(recCanvas, {
      timestamp: timestampUs,
      duration: frameDurationUs,
    });

    encoder.encode(videoFrame, { keyFrame: frame % 30 === 0 });
    videoFrame.close();

    if (onProgress && frame % 5 === 0) {
      onProgress(Math.min(99, Math.floor((frame / totalFrames) * 100)));
    }

    if (frame % 15 === 0) {
      await new Promise((r) => requestAnimationFrame(r));
    }
  }

  // Render final frame
  renderFrame(ctx, exportWidth, exportHeight, 1, config, exportBg);
  const finalFrame = new VideoFrame(recCanvas, {
    timestamp: Math.round(totalFrames * frameDurationUs),
    duration: frameDurationUs,
  });
  encoder.encode(finalFrame, { keyFrame: false });
  finalFrame.close();

  await encoder.flush();
  muxer.finalize();

  if (onProgress) onProgress(100);

  const fileExt = isMp4 ? 'mp4' : 'webm';
  const blobMime = isMp4 ? 'video/mp4' : 'video/webm';
  const buffer = muxer.target.buffer;
  const blob = new Blob([buffer], { type: blobMime });
  const videoUrl = URL.createObjectURL(blob);

  const cleanName = config.mainText ? config.mainText.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'clip';
  const filename = `${config.presetId || 'volley_overlay'}_${cleanName}.${fileExt}`;

  return {
    blob,
    videoUrl,
    filename,
    isMp4,
    codecLabel: isMp4 ? codecLabel : 'WebM (VP9)',
    mimeType: blobMime,
    exportBg,
  };
}

// 2. Fallback Engine for Legacy Browsers
async function exportWithMediaRecorder({
  renderFrame,
  durationSeconds,
  fps = 30,
  config,
  exportBg,
  exportWidth,
  exportHeight,
  onProgress,
}) {
  return new Promise((resolve, reject) => {
    try {
      const recCanvas = document.createElement('canvas');
      recCanvas.width = exportWidth;
      recCanvas.height = exportHeight;
      const ctx = recCanvas.getContext('2d');

      const videoStream = recCanvas.captureStream(fps);
      const stream = new MediaStream([...videoStream.getVideoTracks()]);

      const mimeTypes = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }
      if (!selectedMimeType) selectedMimeType = 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 12000000,
      });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const durationMs = durationSeconds * 1000;

      mediaRecorder.onstop = () => {
        const isMp4 = selectedMimeType.includes('mp4');
        const fileExt = isMp4 ? 'mp4' : 'webm';
        const blobMime = isMp4 ? 'video/mp4' : 'video/webm';
        const blob = new Blob(chunks, { type: blobMime });
        const videoUrl = URL.createObjectURL(blob);
        const cleanName = config.mainText ? config.mainText.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'clip';
        const filename = `${config.presetId || 'volley_overlay'}_${cleanName}.${fileExt}`;

        resolve({ blob, videoUrl, filename, isMp4, mimeType: selectedMimeType, exportBg });
      };

      mediaRecorder.start(100);
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        renderFrame(ctx, exportWidth, exportHeight, progress, config, exportBg);
        if (onProgress) onProgress(Math.min(100, Math.floor(progress * 100)));

        if (elapsed < durationMs) {
          requestAnimationFrame(step);
        } else {
          renderFrame(ctx, exportWidth, exportHeight, 1, config, exportBg);
          if (onProgress) onProgress(100);
          setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
          }, 100);
        }
      }

      requestAnimationFrame(step);
    } catch (err) {
      reject(err);
    }
  });
}
