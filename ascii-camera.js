// ============================================================
// Live ASCII-art webcam. Self-contained: owns its own video element,
// canvas, and render loop. Exposes window.AsciiCam.open() / .close().
// Always call .close() when leaving — it stops the camera stream.
// ============================================================

const ASCII_CHARS = "@#%*+=-:. "; // dark -> light
const ASCII_COLS = 90; // characters per row (tune for density)
const FONT_ASPECT = 0.55; // monospace chars are taller than wide

let videoEl = null;
let canvasEl = null;
let canvasCtx = null;
let streamRef = null;
let rafId = null;
let outputEl = null;

function ensureElements() {
  if (videoEl) return;
  videoEl = document.createElement("video");
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.muted = true;

  canvasEl = document.createElement("canvas");
  canvasCtx = canvasEl.getContext("2d", { willReadFrequently: true });
}

function renderFrame() {
  if (!streamRef) return;

  const vw = videoEl.videoWidth,
    vh = videoEl.videoHeight;
  if (vw === 0 || vh === 0) {
    rafId = requestAnimationFrame(renderFrame);
    return;
  }

  const cols = ASCII_COLS;
  const rows = Math.round((vh / vw) * cols * FONT_ASPECT);
  canvasEl.width = cols;
  canvasEl.height = rows;

  // mirror horizontally so it feels like a real mirror, not a recording
  canvasCtx.save();
  canvasCtx.scale(-1, 1);
  canvasCtx.drawImage(videoEl, -cols, 0, cols, rows);
  canvasCtx.restore();

  const frame = canvasCtx.getImageData(0, 0, cols, rows).data;
  let out = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = (y * cols + x) * 4;
      const r = frame[idx],
        g = frame[idx + 1],
        b = frame[idx + 2];
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255; // 0 (dark) - 1 (light)
      const charIdx = Math.floor((1 - brightness) * (ASCII_CHARS.length - 1));
      out += ASCII_CHARS[charIdx];
    }
    out += "\n";
  }

  if (outputEl) outputEl.textContent = out;
  rafId = requestAnimationFrame(renderFrame);
}

const AsciiCam = {
  // targetEl: the <pre> (or any element) to render ASCII text into
  // onError: optional callback if camera access fails/denied
  async open(targetEl, onError) {
    ensureElements();
    outputEl = targetEl;

    try {
      streamRef = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      videoEl.srcObject = streamRef;
      await videoEl.play();
      rafId = requestAnimationFrame(renderFrame);
    } catch (err) {
      if (onError) onError(err);
    }
  },

  close() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (streamRef) {
      streamRef.getTracks().forEach((track) => track.stop());
      streamRef = null;
    }
    if (outputEl) outputEl.textContent = "";
    outputEl = null;
  },
};

window.AsciiCam = AsciiCam;
