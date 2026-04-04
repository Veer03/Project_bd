/* ════════════════════════════════════════════
   CONFIG — change these to personalise
   ════════════════════════════════════════════ */
const CONFIG = {
  name: "Simran",
  candleCount: 6,
  cutsNeeded: 5, // clicks to fully slice the cake
  blowThreshold: 0.11, // mic volume 0–1 needed to blow (lower = easier)

  message: `Some things never change — like how much you light up every room you walk into.

You make the ordinary feel extraordinary, and the people around you feel seen.

Happy Birthday, Simran. This one's all yours — every confetti piece, every candle, every wish.

Here's to you. 💚`,

  reasons: [
    "Because you make ordinary days feel extraordinary ✨",
    "Because your laugh is genuinely contagious 😄",
    "Because you always show up when it matters 💚",
    "Because you deserve every single good thing 🌿",
    "Because the world is genuinely better with you in it 🌸",
  ],
};

/* ════════════════════════════════════════════
   GLOBAL STATE
   ════════════════════════════════════════════ */
let selfieDataURL = null; // stores the photo booth selfie
let reasonIndex = 0; // cycles through CONFIG.reasons
let audioCtx = null; // Web Audio API context (shared)
let vizAnimId = null; // visualizer animation frame ID

/* ════════════════════════════════════════════
   DOM REFERENCES
   ════════════════════════════════════════════ */
const sections = document.querySelectorAll(".section");
const nameSpans = document.querySelectorAll("[data-name]");
const finalMessage = document.getElementById("final-message");

/* ════════════════════════════════════════════
   ① SECTION NAVIGATOR
   ════════════════════════════════════════════ */
function showSection(n) {
  sections.forEach((s) => s.classList.remove("active"));
  const target = document.querySelector(`[data-section="${n}"]`);
  if (!target) return;
  target.classList.add("active");

  // Trigger fade-in on content
  const content = target.querySelector(".section-content");
  if (content) {
    content.classList.remove("fade-in-up");
    void content.offsetWidth; // force reflow to restart animation
    content.classList.add("fade-in-up");
  }

  // Section-specific init
  if (n === 1) startParticles();
  if (n === 6) initFinalSection();
}

/* ════════════════════════════════════════════
   ② PARTICLE SYSTEM
   ════════════════════════════════════════════ */
const pCanvas = document.getElementById("particle-canvas");
const pCtx = pCanvas.getContext("2d");
let particles = [];
let mouseX = 0;
let mouseY = 0;
let pAnimId = null;

const EMOJIS = ["🌸", "🌿", "💚", "✨", "🍃", "🌱", "🕊️"];

function resizeParticleCanvas() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
}

class Particle {
  constructor() {
    this.reset(true);
  }

  reset(initial = false) {
    this.x = Math.random() * pCanvas.width;
    this.y = initial
      ? Math.random() * pCanvas.height // spread on load
      : pCanvas.height + 30; // rise from bottom
    this.vy = -(Math.random() * 1.2 + 0.4);
    this.vx = Math.random() * 0.5 - 0.25;
    this.size = Math.random() * 20 + 12;
    this.opacity = Math.random() * 0.5 + 0.45;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpd = Math.random() * 0.035 + 0.01;
    this.emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    this.popping = false;
    this.popScale = 1;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpd = (Math.random() - 0.5) * 0.04;
  }

  update() {
    this.y += this.vy;
    this.x += this.vx;
    this.wobble += this.wobbleSpd;
    this.rotation += this.rotSpd;
    this.x += Math.sin(this.wobble) * 0.6;

    // Mouse attraction within 130px
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 130) {
      this.x += (dx / d) * 0.9;
      this.y += (dy / d) * 0.9;
    }

    if (this.popping) {
      this.popScale += 0.18;
      this.opacity -= 0.09;
    }

    // Reset when off screen or faded
    if (
      this.opacity <= 0 ||
      this.y < -60 ||
      this.x < -60 ||
      this.x > pCanvas.width + 60
    ) {
      this.reset(false);
    }
  }

  draw() {
    pCtx.save();
    pCtx.translate(this.x, this.y);
    pCtx.scale(this.popScale, this.popScale);
    pCtx.rotate(this.rotation);
    pCtx.globalAlpha = Math.max(0, this.opacity);
    pCtx.font = `${this.size}px serif`;
    pCtx.textAlign = "center";
    pCtx.textBaseline = "middle";
    pCtx.fillText(this.emoji, 0, 0);
    pCtx.restore();
  }

  isHit(cx, cy) {
    return Math.hypot(cx - this.x, cy - this.y) < this.size / 2;
  }
}

function startParticles() {
  resizeParticleCanvas();
  if (pAnimId) return;
  particles = Array.from({ length: 45 }, () => new Particle());

  function loop() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    pAnimId = requestAnimationFrame(loop);
  }
  loop();
}

function stopParticles() {
  cancelAnimationFrame(pAnimId);
  pAnimId = null;
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
}

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});
window.addEventListener("resize", resizeParticleCanvas);

// Click on landing canvas → pop particle
pCanvas.addEventListener("click", (e) => {
  let hit = false;
  particles.forEach((p) => {
    if (!p.popping && p.isHit(e.clientX, e.clientY)) {
      p.popping = true;
      hit = true;
    }
  });
  if (hit) {
    confetti({
      particleCount: 22,
      spread: 55,
      origin: {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      },
      colors: ["#7ec8a0", "#f9c6d0", "#ffffff", "#b8e0c8", "#f9c74f"],
      scalar: 0.75,
    });
  }
});

/* ════════════════════════════════════════════
   ③ CAKE — BUILD CANDLES
   ════════════════════════════════════════════ */
const candlesRow = document.getElementById("candles-row");
let candlesOut = 0;

function buildCandles() {
  candlesRow.innerHTML = "";
  candlesOut = 0;
  for (let i = 0; i < CONFIG.candleCount; i++) {
    const candle = document.createElement("div");
    candle.className = "candle";
    const flame = document.createElement("div");
    flame.className = "flame";
    flame.dataset.index = i;
    candle.appendChild(flame);
    candlesRow.appendChild(candle);
  }
  updateCandleCount();
}

function updateCandleCount() {
  const el = document.getElementById("candle-count");
  if (el)
    el.textContent = `${CONFIG.candleCount - candlesOut} of ${CONFIG.candleCount} remaining`;
}

function blowOutCandle() {
  const flames = candlesRow.querySelectorAll(".flame:not(.out)");
  if (flames.length === 0) return;
  // Blow out a random unlit one (feels more natural)
  const target = flames[Math.floor(Math.random() * flames.length)];
  target.classList.add("out");
  candlesOut++;
  updateCandleCount();

  // Small puff confetti
  confetti({
    particleCount: 12,
    spread: 30,
    origin: { x: 0.5, y: 0.4 },
    colors: ["#fff", "#b8e0c8"],
    scalar: 0.6,
  });

  if (candlesOut >= CONFIG.candleCount) {
    onAllCandlesOut();
  }
}

function onAllCandlesOut() {
  stopMic();
  document.getElementById("volume-wrap").style.display = "none";
  document.getElementById("btn-start-mic").style.display = "none";

  // Big confetti burst
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.5 },
    colors: ["#7ec8a0", "#f9c6d0", "#f9c74f", "#fff"],
  });

  setTimeout(() => {
    document.getElementById("cut-prompt").style.display = "block";
    document.getElementById("cuts-left").textContent = CONFIG.cutsNeeded;
  }, 800);
}

/* ════════════════════════════════════════════
   ④ MIC — BLOW DETECTION (Web Audio API)
   ════════════════════════════════════════════ */
let micStream = null;
let micAnalyser = null;
let micAnimId = null;

async function startMic() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // Create AudioContext only after user gesture (browser requirement)
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const source = audioCtx.createMediaStreamSource(micStream);
    micAnalyser = audioCtx.createAnalyser();
    micAnalyser.fftSize = 256; // how many frequency buckets to analyse
    source.connect(micAnalyser);

    const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
    const volBar = document.getElementById("volume-bar");

    document.getElementById("btn-start-mic").style.display = "none";
    document.getElementById("volume-wrap").style.display = "block";

    function detectBlow() {
      micAnalyser.getByteFrequencyData(dataArray);

      // Average volume across all frequency bins
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const volume = avg / 255; // normalise to 0–1

      // Update visual bar
      volBar.style.width = `${Math.min(volume * 5 * 100, 100)}%`;

      if (volume > CONFIG.blowThreshold) {
        blowOutCandle();
      }

      // Only keep checking if candles remain
      if (candlesOut < CONFIG.candleCount) {
        micAnimId = requestAnimationFrame(detectBlow);
      }
    }
    detectBlow();
  } catch (err) {
    alert("Mic access denied. Please allow microphone access and try again.");
    console.error("Mic error:", err);
  }
}

function stopMic() {
  cancelAnimationFrame(micAnimId);
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }
}

document.getElementById("btn-start-mic").addEventListener("click", startMic);

/* ════════════════════════════════════════════
   ⑤ CLICK-TO-CUT CAKE
   ════════════════════════════════════════════ */
let cutsLeft = CONFIG.cutsNeeded;

document.getElementById("cake-wrapper").addEventListener("click", () => {
  if (document.getElementById("cut-prompt").style.display === "none") return;

  cutsLeft--;
  document.getElementById("cuts-left").textContent = cutsLeft;

  // Shake the cake
  const cw = document.getElementById("cake-wrapper");
  cw.classList.add("sliced");
  setTimeout(() => cw.classList.remove("sliced"), 300);

  // Small confetti per cut
  confetti({
    particleCount: 20,
    spread: 40,
    origin: { x: 0.5, y: 0.55 },
    colors: ["#f9c6d0", "#fff", "#f9c74f"],
  });

  if (cutsLeft <= 0) {
    onCakeCut();
  }
});

function onCakeCut() {
  document.getElementById("cut-prompt").style.display = "none";

  // Big celebration burst
  ["left", "right"].forEach((side, i) => {
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: side === "left" ? 60 : 120,
        spread: 55,
        origin: { x: side === "left" ? 0.2 : 0.8, y: 0.6 },
        colors: ["#7ec8a0", "#f9c6d0", "#f9c74f", "#fff", "#b8e0c8"],
      });
    }, i * 250);
  });

  setTimeout(() => {
    document.getElementById("wish-done").style.display = "block";
  }, 600);
}

document
  .getElementById("btn-to-booth")
  .addEventListener("click", () => showSection(3));

/* ════════════════════════════════════════════
   ⑥ PHOTO BOOTH (getUserMedia video)
   ════════════════════════════════════════════ */
const boothVideo = document.getElementById("booth-video");
const boothCanvas = document.getElementById("booth-canvas");
const boothCtx = boothCanvas.getContext("2d");
let camStream = null;
let boothAnimId = null;
let activeFilter = "none";

async function startCamera() {
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    boothVideo.srcObject = camStream;
    boothVideo.style.display = "block";
    document.getElementById("booth-placeholder").style.display = "none";

    boothVideo.addEventListener("loadedmetadata", () => {
      boothCanvas.width = boothVideo.videoWidth || 340;
      boothCanvas.height = boothVideo.videoHeight || 255;
      drawBoothOverlay();
    });

    document.getElementById("btn-start-cam").style.display = "none";
    document.getElementById("btn-capture").style.display = "inline-flex";
  } catch (err) {
    alert("Camera access denied. Please allow camera access.");
    console.error("Camera error:", err);
  }
}

// Draw animated sparkle overlay on top of webcam
function drawBoothOverlay() {
  boothCtx.clearRect(0, 0, boothCanvas.width, boothCanvas.height);

  // Draw birthday text banner at bottom
  boothCtx.save();
  boothCtx.fillStyle = "rgba(126,200,160,0.85)";
  boothCtx.fillRect(0, boothCanvas.height - 36, boothCanvas.width, 36);
  boothCtx.fillStyle = "#fff";
  boothCtx.font = 'bold 16px "DM Sans", sans-serif';
  boothCtx.textAlign = "center";
  boothCtx.fillText(
    `🎂 Happy Birthday ${CONFIG.name}! 🎂`,
    boothCanvas.width / 2,
    boothCanvas.height - 12,
  );
  boothCtx.restore();

  boothAnimId = requestAnimationFrame(drawBoothOverlay);
}

function captureSelfie() {
  // Create a merged canvas: video frame + overlay
  const merged = document.createElement("canvas");
  merged.width = boothCanvas.width;
  merged.height = boothCanvas.height;
  const mCtx = merged.getContext("2d");

  // Flip horizontally to match the mirrored CSS on the video
  mCtx.save();
  mCtx.scale(-1, 1);
  mCtx.drawImage(boothVideo, -merged.width, 0, merged.width, merged.height);
  mCtx.restore();

  // Apply filter if selected
  if (activeFilter === "warm") {
    mCtx.fillStyle = "rgba(255,180,80,0.15)";
    mCtx.fillRect(0, 0, merged.width, merged.height);
  } else if (activeFilter === "cool") {
    mCtx.fillStyle = "rgba(80,120,255,0.12)";
    mCtx.fillRect(0, 0, merged.width, merged.height);
  }

  // Draw the overlay (banner) on top
  mCtx.drawImage(boothCanvas, 0, 0);

  selfieDataURL = merged.toDataURL("image/png");

  // Show result
  document.getElementById("selfie-img").src = selfieDataURL;
  document.getElementById("selfie-result").style.display = "block";
  document.getElementById("btn-capture").style.display = "none";

  // Stop camera to save power
  stopCamera();

  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.5 },
    colors: ["#7ec8a0", "#fff", "#f9c6d0"],
  });
}

function stopCamera() {
  cancelAnimationFrame(boothAnimId);
  if (camStream) {
    camStream.getTracks().forEach((t) => t.stop());
    camStream = null;
  }
}

// Filter buttons
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    // Remove all filter classes then add the selected one
    boothVideo.className = boothVideo.className
      .replace(/filter-\w+/g, "")
      .trim();
    if (activeFilter !== "none")
      boothVideo.classList.add(`filter-${activeFilter}`);
  });
});

document.getElementById("btn-start-cam").addEventListener("click", startCamera);
document.getElementById("btn-capture").addEventListener("click", captureSelfie);
document.getElementById("btn-after-booth").addEventListener("click", () => {
  stopCamera();
  showSection(4);
});

/* ════════════════════════════════════════════
   ⑦ VOICE COMMANDS (Web Speech API)
   ════════════════════════════════════════════ */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false; // stop after one result
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (e) => {
    const heard = e.results[0][0].transcript.toLowerCase().trim();
    document.getElementById("voice-transcript").textContent = heard;
    document.getElementById("voice-feedback").style.display = "block";
    handleVoiceCommand(heard);
    document.getElementById("btn-voice").classList.remove("listening");
  };

  recognition.onerror = () => {
    document.getElementById("btn-voice").classList.remove("listening");
  };
}

function handleVoiceCommand(cmd) {
  const el = document.getElementById("voice-response");

  if (cmd.includes("confetti") || cmd.includes("more")) {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.4 } });
    el.textContent = "🎉 Confetti launched!";
  } else if (cmd.includes("reason") || cmd.includes("tell me")) {
    el.textContent = CONFIG.reasons[reasonIndex % CONFIG.reasons.length];
    reasonIndex++;
  } else if (cmd.includes("song") || cmd.includes("play")) {
    el.textContent = "🎵 Heading to your song!";
    setTimeout(() => showSection(5), 1200);
  } else if (cmd.includes("happy birthday") || cmd.includes("birthday")) {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.3 } });
    el.textContent = "🎂 Happy Birthday Simran!! 💚";
  } else {
    el.textContent = `Hmm, I didn\'t catch that. Try again!`;
  }
}

document.getElementById("btn-voice").addEventListener("click", () => {
  if (!SpeechRecognition) {
    alert("Voice commands not supported in this browser. Try Chrome!");
    return;
  }
  const btn = document.getElementById("btn-voice");
  btn.classList.add("listening");
  document.getElementById("voice-feedback").style.display = "none";
  recognition.start();
});

document
  .getElementById("btn-after-voice")
  .addEventListener("click", () => showSection(5));

/* ════════════════════════════════════════════
   ⑧ MUSIC VISUALIZER (Web Audio API)
   ════════════════════════════════════════════ */
const vizCanvas = document.getElementById("visualizer-canvas");
const vizCtx = vizCanvas.getContext("2d");
const audioEl = document.getElementById("birthday-audio");
let vizSource = null;
let vizAnalyser = null;

function initVisualizer() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (vizSource) return; // already set up

  vizSource = audioCtx.createMediaElementSource(audioEl);
  vizAnalyser = audioCtx.createAnalyser();
  vizAnalyser.fftSize = 128; // 64 frequency bars

  vizSource.connect(vizAnalyser);
  vizAnalyser.connect(audioCtx.destination); // so we still hear the audio
}

function drawVisualizer() {
  const W = vizCanvas.width;
  const H = vizCanvas.height;

  const dataArray = new Uint8Array(vizAnalyser.frequencyBinCount);
  const barWidth = (W / dataArray.length) * 2;

  function frame() {
    vizAnimId = requestAnimationFrame(frame);

    vizAnalyser.getByteFrequencyData(dataArray);
    vizCtx.clearRect(0, 0, W, H);

    dataArray.forEach((value, i) => {
      const barH = (value / 255) * H * 0.9;
      const x = i * (barWidth + 2);

      // Gradient per bar — green to pink based on height
      const grad = vizCtx.createLinearGradient(x, H, x, H - barH);
      grad.addColorStop(0, "#4a9e72");
      grad.addColorStop(0.6, "#7ec8a0");
      grad.addColorStop(1, "#f9c6d0");

      vizCtx.fillStyle = grad;
      vizCtx.beginPath();
      vizCtx.roundRect(x, H - barH, barWidth, barH, 4);
      vizCtx.fill();
    });
  }
  frame();

  document.querySelector(".viz-glow").classList.add("active");
}

function stopVisualizer() {
  cancelAnimationFrame(vizAnimId);
  vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
  document.querySelector(".viz-glow").classList.remove("active");
}

function resizeVizCanvas() {
  vizCanvas.width = vizCanvas.offsetWidth;
  vizCanvas.height = vizCanvas.offsetHeight;
}

document.getElementById("btn-play-song").addEventListener("click", () => {
  resizeVizCanvas();
  initVisualizer();

  audioEl.currentTime = 0;
  audioEl.play().catch(() => {
    // If no audio file yet, visualizer still runs (silently)
    console.warn(
      "No audio file found. Add audio/happy-birthday.mp3 to the project.",
    );
  });

  drawVisualizer();
  document.getElementById("btn-play-song").style.display = "none";
  document.getElementById("btn-stop-song").style.display = "inline-block";
});

document.getElementById("btn-stop-song").addEventListener("click", () => {
  audioEl.pause();
  stopVisualizer();
  document.getElementById("btn-stop-song").style.display = "none";
  document.getElementById("btn-play-song").style.display = "inline-block";
});

audioEl.addEventListener("ended", () => {
  stopVisualizer();
  document.getElementById("btn-stop-song").style.display = "none";
  document.getElementById("btn-play-song").style.display = "inline-block";
});

document.getElementById("btn-after-song").addEventListener("click", () => {
  audioEl.pause();
  stopVisualizer();
  showSection(6);
});

/* ════════════════════════════════════════════
   ⑨ FINAL SECTION
   ════════════════════════════════════════════ */
function initFinalSection() {
  // Fill message from CONFIG
  const paragraphs = CONFIG.message
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => `<p>${l.trim()}</p>`)
    .join("");
  finalMessage.innerHTML = paragraphs;

  // Show selfie if captured
  if (selfieDataURL) {
    const finalSelfie = document.getElementById("final-selfie");
    const selfieWrap = document.getElementById("final-selfie-wrap");
    finalSelfie.src = selfieDataURL;
    selfieWrap.style.display = "block";
  }

  // Auto-confetti on arrival
  setTimeout(() => {
    ["left", "center", "right"].forEach((pos, i) => {
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 70,
          angle: pos === "left" ? 60 : pos === "right" ? 120 : 90,
          origin: {
            x: pos === "left" ? 0.15 : pos === "right" ? 0.85 : 0.5,
            y: 0.3,
          },
          colors: ["#7ec8a0", "#f9c6d0", "#f9c74f", "#fff", "#b8e0c8"],
        });
      }, i * 350);
    });
  }, 400);
}

document.getElementById("btn-more-confetti").addEventListener("click", () => {
  confetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.4 },
    colors: ["#7ec8a0", "#f9c6d0", "#f9c74f", "#fff"],
  });
});

document.getElementById("btn-restart").addEventListener("click", () => {
  // Reset cake
  cutsLeft = CONFIG.cutsNeeded;
  document.getElementById("cut-prompt").style.display = "none";
  document.getElementById("wish-done").style.display = "none";
  document.getElementById("volume-wrap").style.display = "none";
  document.getElementById("btn-start-mic").style.display = "block";
  document.getElementById("selfie-result").style.display = "none";
  document.getElementById("btn-capture").style.display = "none";
  document.getElementById("btn-start-cam").style.display = "block";
  document.getElementById("voice-feedback").style.display = "none";
  document.getElementById("btn-play-song").style.display = "inline-block";
  document.getElementById("btn-stop-song").style.display = "none";
  buildCandles();
  stopMic();
  stopCamera();
  audioEl.pause();
  stopVisualizer();
  showSection(1);
});

/* ════════════════════════════════════════════
   ⑩ SECTION 1 BUTTON
   ════════════════════════════════════════════ */
document.getElementById("btn-start").addEventListener("click", () => {
  stopParticles();
  showSection(2);
});

/* ════════════════════════════════════════════
   INIT — runs on page load
   ════════════════════════════════════════════ */
function init() {
  // Inject name everywhere
  nameSpans.forEach((s) => {
    s.textContent = CONFIG.name;
  });

  // Build candles
  buildCandles();

  // Show section 1 with particles
  showSection(1);

  console.log(`🎂 Birthday site loaded for: ${CONFIG.name}`);
}

init();
