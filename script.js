/* ════════════════════════════════════════════
   CONFIG — change these to personalise
   ════════════════════════════════════════════ */
const CONFIG = {
  name: "Simran",
  candleCount: 4,
  cutsNeeded: 5,
  blowThreshold: 0.11,

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
let selfieDataURL = null;
let reasonIndex = 0;
let audioCtx = null;

/* ════════════════════════════════════════════
   ══ GLOBAL MUSIC ENGINE ══
   Starts on first user interaction, runs forever.
   Exposes: getMusicData() → { bass, mid, treble, volume, isBeat }
   ════════════════════════════════════════════ */
const MusicEngine = (() => {
  const audioEl = document.getElementById("theAudio");
  let analyser = null;
  let dataArray = null;
  let started = false;
  let lastBeatTime = 0;
  let beatCooldown = 180; // ms between beats
  let peakHistory = [];
  const HISTORY_LEN = 30;

  // Hue targets for background shift
  let currentHue = 140; // start green-ish
  let targetHue = 140;

  function start() {
    if (started) return;
    started = true;

    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const source = audioCtx.createMediaElementSource(audioEl);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    audioEl.loop = true;
    audioEl.volume = 0.7;
    audioCtx.resume().then(() => {
      audioEl.play().catch(() => {});
    });

    runBackgroundShifter();
  }

  function getData() {
    if (!analyser)
      return { bass: 0, mid: 0, treble: 0, volume: 0, isBeat: false };

    analyser.getByteFrequencyData(dataArray);
    const len = dataArray.length;

    // Frequency bands
    const bassEnd = Math.floor(len * 0.1);
    const midEnd = Math.floor(len * 0.45);

    let bassSum = 0,
      midSum = 0,
      trebleSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += dataArray[i];
    for (let i = bassEnd; i < midEnd; i++) midSum += dataArray[i];
    for (let i = midEnd; i < len; i++) trebleSum += dataArray[i];

    const bass = bassSum / bassEnd / 255;
    const mid = midSum / (midEnd - bassEnd) / 255;
    const treble = trebleSum / (len - midEnd) / 255;
    const volume = (bassSum + midSum + trebleSum) / len / 255;

    // Beat detection via peak threshold
    peakHistory.push(volume);
    if (peakHistory.length > HISTORY_LEN) peakHistory.shift();
    const avg = peakHistory.reduce((a, b) => a + b, 0) / peakHistory.length;
    const now = performance.now();
    const isBeat =
      volume > avg * 1.35 && volume > 0.08 && now - lastBeatTime > beatCooldown;
    if (isBeat) lastBeatTime = now;

    return { bass, mid, treble, volume, isBeat };
  }

  // Smoothly shift the page background hue based on bass
  function runBackgroundShifter() {
    const root = document.documentElement;

    function tick() {
      const { bass, isBeat } = getData();

      // On beats, target a new hue
      if (isBeat) {
        // Cycle: green → pink → gold → teal → back
        const hues = [140, 340, 45, 170, 280, 20];
        targetHue = hues[Math.floor(Math.random() * hues.length)];
      }

      // Smoothly lerp toward target
      currentHue += (targetHue - currentHue) * 0.02;

      // Subtle saturation/lightness boost on bass hits
      const sat = 18 + bass * 22;
      const lgt = 8 + bass * 6;

      root.style.setProperty("--bg-hue", `${currentHue.toFixed(1)}`);
      root.style.setProperty("--bg-sat", `${sat.toFixed(1)}%`);
      root.style.setProperty("--bg-lgt", `${lgt.toFixed(1)}%`);

      requestAnimationFrame(tick);
    }
    tick();
  }

  // Start music on first user interaction (browser autoplay policy)
  let userInteracted = false;
  function onFirstInteraction() {
    if (userInteracted) return;
    userInteracted = true;
    start();
    const hint = document.getElementById("music-hint");
    if (hint) hint.style.display = "none";
    document.removeEventListener("mousedown", onFirstInteraction);
    document.removeEventListener("keydown", onFirstInteraction);
    document.removeEventListener("touchstart", onFirstInteraction);
  }
  document.addEventListener("mousedown", onFirstInteraction);
  document.addEventListener("keydown", onFirstInteraction);
  document.addEventListener("touchstart", onFirstInteraction);

  return { getData, start };
})();

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

  const content = target.querySelector(".section-content");
  if (content) {
    content.classList.remove("fade-in-up");
    void content.offsetWidth;
    content.classList.add("fade-in-up");
  }

  if (n === 1) startParticles();
  if (n === 6) initFinalSection();
}

/* ════════════════════════════════════════════
   ② PARTICLE SYSTEM — music reactive
   ════════════════════════════════════════════ */
const pCanvas = document.getElementById("particle-canvas");
const pCtx = pCanvas.getContext("2d");
let particles = [];
let mouseX = 0;
let mouseY = 0;
let pAnimId = null;

const EMOJIS = ["🌸", "🌿", "💚", "✨", "🍃", "🌱", "🕊️"];

// Extra emojis that burst out on peaks
const BURST_EMOJIS = [
  "🎉",
  "🎊",
  "💥",
  "⭐",
  "🌟",
  "🔥",
  "🎈",
  "🎂",
  "💫",
  "🥳",
];

function resizeParticleCanvas() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
}

class Particle {
  constructor(forceX, forceY, isBurst) {
    this.isBurst = isBurst || false;
    if (forceX !== undefined) {
      this.x = forceX;
      this.y = forceY;
      this.vx = (Math.random() - 0.5) * 12;
      this.vy = -(Math.random() * 8 + 4);
      this.size = Math.random() * 24 + 22;
      this.opacity = 1;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpd = Math.random() * 0.06 + 0.02;
      this.emoji =
        BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)];
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpd = (Math.random() - 0.5) * 0.25;
      this.gravity = 0.18;
      this.life = 1;
      this.lifeDecay = Math.random() * 0.018 + 0.012;
      this.baseSize = this.size;
      this.musicScale = 1;
      this.chaosX = 0;
      this.chaosY = 0;
    } else {
      this.reset(true);
    }
  }

  reset(initial = false) {
    this.x = Math.random() * pCanvas.width;
    this.y = initial ? Math.random() * pCanvas.height : pCanvas.height + 26;
    this.vy = -(Math.random() * 1.2 + 0.4);
    this.vx = Math.random() * 0.5 - 0.25;
    this.baseSize = Math.random() * 20 + 22;
    this.size = this.baseSize;
    this.opacity = Math.random() * 0.5 + 0.45;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpd = Math.random() * 0.035 + 0.01;
    this.emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpd = (Math.random() - 0.5) * 0.04;
    this.gravity = 0;
    this.life = 1;
    this.lifeDecay = 0;
    this.musicScale = 1;
    this.chaosX = 0;
    this.chaosY = 0;
    this.isBurst = false;
  }

  update(musicData) {
    const { bass, mid, treble, volume, isBeat } = musicData;

    if (this.isBurst) {
      // Burst particles: fly out, gravity pulls down, fade
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.wobble += this.wobbleSpd;
      this.vx += Math.sin(this.wobble) * 0.3;
      this.rotation += this.rotSpd * (1 + treble * 4);
      this.life -= this.lifeDecay;
      this.opacity = Math.max(0, this.life);

      // React to music even while burst
      this.rotSpd += (Math.random() - 0.5) * bass * 0.08;
      return;
    }

    // Normal ambient particles
    // Music-reactive chaos: on beat, scatter chaotically
    if (isBeat) {
      this.chaosX = (Math.random() - 0.5) * 18 * bass;
      this.chaosY = (Math.random() - 0.5) * 18 * bass;
      this.rotSpd = (Math.random() - 0.5) * (0.15 + bass * 0.6); // wild spin
    }

    // Dampen chaos smoothly
    this.chaosX *= 0.88;
    this.chaosY *= 0.88;
    this.rotSpd *= 0.94;

    this.y += this.vy - mid * 0.8; // rise faster with mid freqs
    this.x += this.vx + this.chaosX;
    this.y += this.chaosY;
    this.wobble += this.wobbleSpd + treble * 0.04;
    this.rotation += this.rotSpd;
    this.x += Math.sin(this.wobble) * (0.6 + bass * 2.5); // wider wobble on bass

    // Music-reactive size pulse
    const targetScale = 1 + volume * 1.8 + bass * 1.2;
    this.musicScale += (targetScale - this.musicScale) * 0.12;
    this.size = this.baseSize * this.musicScale;

    // Opacity pulses with treble
    this.opacity = Math.min(
      1,
      Math.max(0.15, Math.random() * 0.5 + 0.35 + treble * 0.3),
    );

    // Mouse attraction
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 130) {
      this.x += (dx / d) * 0.9;
      this.y += (dy / d) * 0.9;
    }

    if (
      this.opacity <= 0 ||
      this.y < -80 ||
      this.x < -80 ||
      this.x > pCanvas.width + 80
    ) {
      this.reset(false);
    }
  }

  draw() {
    if (this.opacity <= 0) return;
    pCtx.save();
    pCtx.translate(this.x, this.y);
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

  isDead() {
    return this.isBurst && this.life <= 0;
  }
}

// Track when we last did an emoji burst to throttle them
let lastEmojiPeak = 0;

/* ════════════════════════════════════════════
   GLOBAL BACKGROUND EMOJI LAYER
   Floats softly on every section (not landing).
   Injected as a fixed canvas behind everything.
   ════════════════════════════════════════════ */
const bgCanvas = document.createElement("canvas");
bgCanvas.id = "bg-emoji-canvas";
bgCanvas.style.cssText =
  "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.45;";
document.body.appendChild(bgCanvas);
const bgCtx = bgCanvas.getContext("2d");
const BG_EMOJIS = ["🌸", "✨", "🌿", "💚", "🍃", "🌱", "🕊️", "⭐", "💫"];
let bgParticles = [];

class BgParticle {
  constructor() {
    this.reset(true);
  }
  reset(initial) {
    this.x = Math.random() * bgCanvas.width;
    this.y = initial ? Math.random() * bgCanvas.height : bgCanvas.height + 30;
    this.vy = -(Math.random() * 0.5 + 0.2);
    this.vx = (Math.random() - 0.5) * 0.3;
    this.size = Math.random() * 18 + 14;
    this.baseSize = this.size;
    this.opacity = Math.random() * 0.35 + 0.15;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpd = Math.random() * 0.02 + 0.005;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpd = (Math.random() - 0.5) * 0.02;
    this.emoji = BG_EMOJIS[Math.floor(Math.random() * BG_EMOJIS.length)];
    this.musicScale = 1;
  }
  update(md) {
    const { bass, treble, isBeat } = md;
    this.wobble += this.wobbleSpd;
    this.rotation += this.rotSpd + (isBeat ? (Math.random() - 0.5) * 0.15 : 0);
    this.x += this.vx + Math.sin(this.wobble) * 0.4;
    this.y += this.vy - bass * 0.4;
    const ts = 1 + bass * 0.8 + treble * 0.3;
    this.musicScale += (ts - this.musicScale) * 0.08;
    this.size = this.baseSize * this.musicScale;
    if (isBeat) this.opacity = Math.min(0.65, this.opacity + 0.15);
    else this.opacity += (Math.random() * 0.35 + 0.15 - this.opacity) * 0.05;
    if (this.y < -40 || this.x < -40 || this.x > bgCanvas.width + 40)
      this.reset(false);
  }
  draw() {
    bgCtx.save();
    bgCtx.translate(this.x, this.y);
    bgCtx.rotate(this.rotation);
    bgCtx.globalAlpha = Math.max(0, this.opacity);
    bgCtx.font = `${this.size}px serif`;
    bgCtx.textAlign = "center";
    bgCtx.textBaseline = "middle";
    bgCtx.fillText(this.emoji, 0, 0);
    bgCtx.restore();
  }
}

function initBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  bgParticles = Array.from({ length: 35 }, () => new BgParticle());
}

function runBgLoop() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  initBgCanvas();
  function tick() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    const md = MusicEngine.getData();
    bgParticles.forEach((p) => {
      p.update(md);
      p.draw();
    });
    requestAnimationFrame(tick);
  }
  tick();
}
window.addEventListener("resize", () => {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
});
// Start immediately — always running in background
runBgLoop();

function startParticles() {
  resizeParticleCanvas();
  if (pAnimId) cancelAnimationFrame(pAnimId); // allow clean restart
  pAnimId = null;
  particles = Array.from({ length: 45 }, () => new Particle());

  function loop() {
    const musicData = MusicEngine.getData();

    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

    // Remove dead burst particles
    particles = particles.filter((p) => !p.isDead());

    // Maintain ambient particle count at 45
    while (particles.filter((p) => !p.isBurst).length < 45) {
      particles.push(new Particle());
    }

    // Emoji burst on loud peaks
    const now = performance.now();
    if (
      musicData.isBeat &&
      musicData.bass > 0.25 &&
      now - lastEmojiPeak > 400
    ) {
      lastEmojiPeak = now;
      const count = Math.floor(3 + musicData.bass * 6);
      for (let i = 0; i < count; i++) {
        particles.push(
          new Particle(
            Math.random() * pCanvas.width,
            Math.random() * pCanvas.height * 0.7,
            true,
          ),
        );
      }
      // Confetti micro-burst too
      confetti({
        particleCount: Math.floor(musicData.bass * 40),
        spread: 60,
        origin: { x: Math.random(), y: Math.random() * 0.6 },
        colors: ["#7ec8a0", "#f9c6d0", "#ffffff", "#b8e0c8", "#f9c74f"],
        scalar: 0.7,
        ticks: 80,
      });
    }

    particles.forEach((p) => {
      p.update(musicData);
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

pCanvas.addEventListener("click", (e) => {
  let hit = false;
  particles.forEach((p) => {
    if (!p.isBurst && p.isHit(e.clientX, e.clientY)) {
      // Turn it into a burst particle
      p.isBurst = true;
      p.vx = (Math.random() - 0.5) * 10;
      p.vy = -(Math.random() * 6 + 3);
      p.gravity = 0.18;
      p.life = 1;
      p.lifeDecay = 0.02;
      p.emoji = BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)];
      p.rotSpd = (Math.random() - 0.5) * 0.3;
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
   ③ CANDLE FLAMES — music reactive flicker
   ════════════════════════════════════════════ */
const candlesRow = document.getElementById("candles-row");
let candlesOut = 0;
let flameAnimId = null;

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
  startFlameFlicker();
}

// Continuously update flame CSS to reflect music
function startFlameFlicker() {
  cancelAnimationFrame(flameAnimId);

  function tick() {
    const { bass, mid, treble, isBeat } = MusicEngine.getData();
    const flames = candlesRow.querySelectorAll(".flame:not(.out)");

    flames.forEach((flame, i) => {
      // Each flame gets slightly different phase offset for organic feel
      const phase = (i / CONFIG.candleCount) * Math.PI;
      const flicker =
        1 +
        bass * 1.4 +
        Math.sin(Date.now() * 0.006 + phase) * 0.15 * (1 + mid);
      const sway = Math.sin(Date.now() * 0.004 + phase) * (3 + bass * 12);
      const glowIntensity = 8 + bass * 30 + treble * 15;
      const brightness = isBeat ? 1.4 : 1;

      flame.style.transform = `scaleX(${0.7 + bass * 0.5}) scaleY(${flicker}) translateX(${sway}px)`;
      flame.style.filter = `brightness(${brightness}) drop-shadow(0 0 ${glowIntensity}px rgba(255,200,50,0.9))`;
      flame.style.opacity = `${0.85 + treble * 0.15}`;
    });

    flameAnimId = requestAnimationFrame(tick);
  }
  tick();
}

function updateCandleCount() {
  const el = document.getElementById("candle-count");
  if (el)
    el.textContent = `${CONFIG.candleCount - candlesOut} of ${CONFIG.candleCount} remaining`;
}

function blowOutCandle() {
  const flames = candlesRow.querySelectorAll(".flame:not(.out)");
  if (flames.length === 0) return;
  const target = flames[Math.floor(Math.random() * flames.length)];
  target.classList.add("out");
  candlesOut++;
  updateCandleCount();

  confetti({
    particleCount: 12,
    spread: 40,
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

  confetti({
    particleCount: 220,
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
   ④ MIC — BLOW DETECTION
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

    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const source = audioCtx.createMediaStreamSource(micStream);
    micAnalyser = audioCtx.createAnalyser();
    micAnalyser.fftSize = 256;
    source.connect(micAnalyser);

    const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
    const volBar = document.getElementById("volume-bar");

    document.getElementById("btn-start-mic").style.display = "none";
    document.getElementById("volume-wrap").style.display = "block";

    function detectBlow() {
      micAnalyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const volume = avg / 255;
      volBar.style.width = `${Math.min(volume * 5 * 100, 100)}%`;

      if (volume > CONFIG.blowThreshold) {
        blowOutCandle();
      }

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
let cutsDone = 0;

document.getElementById("cake-wrapper").addEventListener("click", (e) => {
  if (document.getElementById("cut-prompt").style.display === "none") return;

  cutsLeft--;
  cutsDone++;
  document.getElementById("cuts-left").textContent = Math.max(0, cutsLeft);

  const cw = document.getElementById("cake-wrapper");
  cw.className = cw.className.replace(/cut-\d/g, "").trim();
  cw.classList.add("shaking");
  setTimeout(() => cw.classList.remove("shaking"), 300);

  const cutClass = `cut-${Math.min(cutsDone, 4)}`;
  setTimeout(() => cw.classList.add(cutClass), 50);

  const slash = document.createElement("div");
  slash.className = "slash-line";
  cw.appendChild(slash);
  setTimeout(() => slash.remove(), 600);

  confetti({
    particleCount: 29,
    spread: 50,
    origin: {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    },
    colors: ["#f9c6d0", "#fff", "#f9c74f", "#b8e0c8"],
    scalar: 0.8,
  });

  if (cutsLeft <= 0) {
    onCakeCut();
  }
});

function onCakeCut() {
  document.getElementById("cut-prompt").style.display = "none";

  const cw = document.getElementById("cake-wrapper");
  cw.className = cw.className.replace(/cut-[\d\w]+/g, "").trim();
  cw.classList.add("cut-done");

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
   ⑥ PHOTO BOOTH
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

function drawBoothOverlay() {
  const { bass } = MusicEngine.getData();
  boothCtx.clearRect(0, 0, boothCanvas.width, boothCanvas.height);

  boothCtx.save();
  boothCtx.fillStyle = `rgba(126,200,160,${0.75 + bass * 0.25})`;
  boothCtx.fillRect(0, boothCanvas.height - 36, boothCanvas.width, 36);
  boothCtx.fillStyle = "#fff";
  boothCtx.font = `bold ${16 + bass * 4}px "DM Sans", sans-serif`;
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
  const merged = document.createElement("canvas");
  merged.width = boothCanvas.width;
  merged.height = boothCanvas.height;
  const mCtx = merged.getContext("2d");

  mCtx.save();
  mCtx.scale(-1, 1);
  mCtx.drawImage(boothVideo, -merged.width, 0, merged.width, merged.height);
  mCtx.restore();

  if (activeFilter === "warm") {
    mCtx.fillStyle = "rgba(255,180,80,0.15)";
    mCtx.fillRect(0, 0, merged.width, merged.height);
  } else if (activeFilter === "cool") {
    mCtx.fillStyle = "rgba(80,120,255,0.12)";
    mCtx.fillRect(0, 0, merged.width, merged.height);
  } else if (activeFilter === "dreamy") {
    mCtx.fillStyle = "rgba(200,180,255,0.1)";
    mCtx.fillRect(0, 0, merged.width, merged.height);
  }

  // Frame & decorations
  mCtx.save();
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * merged.width;
    const y = Math.random() * 80;
    mCtx.fillStyle = ["#ff4d6d", "#4dabf7", "#ffd43b", "#69db7c"][
      Math.floor(Math.random() * 4)
    ];
    mCtx.fillRect(x, y, 6, 6);
  }

  const flagCount = 8;
  const spacing = merged.width / (flagCount + 1);
  for (let i = 1; i <= flagCount; i++) {
    const x = spacing * i;
    mCtx.beginPath();
    mCtx.moveTo(x - 15, 20);
    mCtx.lineTo(x + 15, 20);
    mCtx.lineTo(x, 50);
    mCtx.closePath();
    const colors = [
      "#ff922b",
      "#ff6b6b",
      "#4dabf7",
      "#845ef7",
      "#ffd43b",
      "#20c997",
    ];
    mCtx.fillStyle = colors[i % colors.length];
    mCtx.fill();
  }

  function drawBalloon(x, y, color) {
    mCtx.beginPath();
    mCtx.arc(x, y, 18, 0, Math.PI * 2);
    mCtx.fillStyle = color;
    mCtx.fill();
    mCtx.beginPath();
    mCtx.moveTo(x, y + 18);
    mCtx.quadraticCurveTo(x - 5, y + 45, x + 2, y + 65);
    mCtx.strokeStyle = "#999";
    mCtx.stroke();
  }

  drawBalloon(40, merged.height - 80, "#ff4d6d");
  drawBalloon(70, merged.height - 70, "#ff922b");
  drawBalloon(merged.width - 40, merged.height - 80, "#ff4d6d");
  drawBalloon(merged.width - 70, merged.height - 70, "#ff922b");

  mCtx.fillStyle = "#20c997";
  mCtx.font = `bold 40px "DM Sans", sans-serif`;
  mCtx.textAlign = "center";
  mCtx.fillText("Happy Birthday :)", merged.width / 2, merged.height - 60);
  mCtx.restore();

  mCtx.save();
  mCtx.fillStyle = "rgba(126,200,160,0.88)";
  mCtx.fillRect(0, merged.height - 36, merged.width, 36);
  mCtx.fillStyle = "#fff";
  mCtx.font = `bold 19px "DM Sans", sans-serif`;
  mCtx.textAlign = "center";
  mCtx.fillText(
    `🎂 you look beautiful!! ${CONFIG.name}! 🎂`,
    merged.width / 2,
    merged.height - 12,
  );
  mCtx.restore();

  selfieDataURL = merged.toDataURL("image/png");
  document.getElementById("selfie-img").src = selfieDataURL;
  document.getElementById("selfie-result").style.display = "block";
  document.getElementById("btn-capture").style.display = "none";

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

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
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
   ⑦ VOICE COMMANDS
   ════════════════════════════════════════════ */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (e) => {
    const heard = e.results[0][0].transcript.toLowerCase().trim();
    document.getElementById("voice-transcript").textContent = heard;
    document.getElementById("voice-feedback").style.display = "block";
    handleVoiceCommand(heard);
    document.getElementById("btn-voice").classList.remove("listening");
  };

  recognition.onerror = (e) => {
    document.getElementById("btn-voice").classList.remove("listening");
    // "no-speech" is normal, don't alert. Only show unexpected errors.
    if (e.error !== "no-speech" && e.error !== "aborted") {
      document.getElementById("voice-response").textContent =
        `Error: ${e.error}. Try again.`;
      document.getElementById("voice-feedback").style.display = "block";
    }
  };

  recognition.onend = () => {
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
    el.textContent = "🎵 Music is already playing! 💚";
  } else if (cmd.includes("happy birthday") || cmd.includes("birthday")) {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.3 } });
    el.textContent = "🎂 Happy Birthday Simran!! 💚";
  } else {
    el.textContent = `Hmm, I didn't catch that. Try again!`;
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
  try {
    recognition.abort(); // stop any in-progress session first
  } catch (e) {}
  setTimeout(() => {
    try {
      recognition.start();
    } catch (e) {
      btn.classList.remove("listening");
    }
  }, 100); // small delay after abort so Firefox is ready
});

document
  .getElementById("btn-after-voice")
  .addEventListener("click", () => showSection(6));

/* ════════════════════════════════════════════
   ⑨ FINAL SECTION
   ════════════════════════════════════════════ */
function initFinalSection() {
  const paragraphs = CONFIG.message
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => `<p>${l.trim()}</p>`)
    .join("");
  finalMessage.innerHTML = paragraphs;

  if (selfieDataURL) {
    const finalSelfie = document.getElementById("final-selfie");
    const selfieWrap = document.getElementById("final-selfie-wrap");
    finalSelfie.src = selfieDataURL;
    selfieWrap.style.display = "block";
  }

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
  cutsLeft = CONFIG.cutsNeeded;
  cutsDone = 0;
  const cw = document.getElementById("cake-wrapper");
  cw.className = cw.className.replace(/cut-[\d\w]+/g, "").trim();
  document.getElementById("cut-prompt").style.display = "none";
  document.getElementById("wish-done").style.display = "none";
  document.getElementById("volume-wrap").style.display = "none";
  document.getElementById("btn-start-mic").style.display = "block";
  document.getElementById("selfie-result").style.display = "none";
  document.getElementById("btn-capture").style.display = "none";
  document.getElementById("btn-start-cam").style.display = "block";
  document.getElementById("voice-feedback").style.display = "none";
  buildCandles();
  stopMic();
  stopCamera();
  showSection(1);
});

/* ════════════════════════════════════════════
   ⑩ LANDING BUTTON
   ════════════════════════════════════════════ */
document.getElementById("btn-start").addEventListener("click", () => {
  stopParticles();
  showSection(2);
});

/* ════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════ */
function init() {
  nameSpans.forEach((s) => {
    s.textContent = CONFIG.name;
  });
  buildCandles();
  showSection(1);
  console.log(`🎂 Birthday site loaded for: ${CONFIG.name}`);
}

init();
