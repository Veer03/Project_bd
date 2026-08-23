// ============================================================
// Listens to the mic, watches for a sustained loud burst (a blow),
// and fires onBlow(). Falls back to onError() if mic access fails
// or isn't available (rooms.js shows a tap-to-blow button instead).
// ============================================================

window.Mic = {
  startCandleListener({ onLevel, onBlow, onError }) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onError();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        const data = new Uint8Array(analyser.fftSize);
        const BLOW_THRESHOLD = 0.15; // RMS level (0-1) that counts as "blowing"
        const SUSTAIN_MS = 200; // must stay above threshold this long
        let aboveSince = null;
        let stopped = false;

        const cleanup = () => {
          stopped = true;
          stream.getTracks().forEach((t) => t.stop());
          ctx.close();
        };

        const tick = () => {
          if (stopped) return;
          analyser.getByteTimeDomainData(data);
          let sumSquares = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sumSquares += v * v;
          }
          const rms = Math.sqrt(sumSquares / data.length);
          if (onLevel) onLevel(rms);

          if (rms > BLOW_THRESHOLD) {
            if (aboveSince === null) aboveSince = performance.now();
            if (performance.now() - aboveSince > SUSTAIN_MS) {
              cleanup();
              onBlow();
              return;
            }
          } else {
            aboveSince = null;
          }
          requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => onError());
  },
};
