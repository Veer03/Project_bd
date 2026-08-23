// ============================================================
// Scene engine. One player avatar, one movement loop, reused for
// garden + every room. Scenes are defined in rooms.js and just
// describe hotspots + decor; this file only knows how to render
// and move through whatever scene is active.
// ============================================================

const PLAYER_SIZE = 30;
const PLAYER_SPEED = 260; // px/sec

let viewW = window.innerWidth,
  viewH = window.innerHeight;
let playerPos = { x: viewW / 2, y: viewH * 0.8 };
const keys = {};
let popupOpen = false;
let currentSceneKey = null;
let currentHotspots = [];
let stageEl, playerEl, promptEl, hotspotsEl, decorEl;

let touchDX = 0,
  touchDY = 0;

window.doorState = {
  1: { unlocked: true, done: false },
  2: { unlocked: false, done: false },
  3: { unlocked: false, done: false },
  final: { unlocked: false, done: false },
};

function boot() {
  const gate = document.getElementById("name-gate");
  const input = document.getElementById("name-input");
  const err = document.getElementById("name-error");
  input.focus();

  const submit = () => {
    const val = input.value.trim().toLowerCase();
    const expected = (window.CONFIG.herName || "").trim().toLowerCase();
    if (val.length > 0 && val === expected) {
      gate.style.display = "none";
      startEngine();
    } else {
      err.textContent = "that's not it. try again.";
    }
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}

function startEngine() {
  stageEl = document.getElementById("stage");
  playerEl = document.getElementById("player");
  promptEl = document.getElementById("prompt");
  hotspotsEl = document.getElementById("hotspots");
  decorEl = document.getElementById("scene-decor");
  stageEl.style.display = "block";

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "e" || e.key === "E") tryInteract();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
  window.addEventListener("resize", () => {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
  });

  setupTouchControls();

  document.getElementById("popup-close").addEventListener("click", Popup.close);
  document
    .getElementById("lightbox-close")
    .addEventListener("click", Lightbox.close);
  document
    .getElementById("lightbox-backdrop")
    .addEventListener("click", Lightbox.close);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") Lightbox.close();
  });

  playMainSongOnce();

  goToScene("garden");
  requestAnimationFrame(loop);
}

function playMainSongOnce() {
  const src = window.CONFIG.mainSong;
  if (!src) return;
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0.5;
  audio.play().catch(() => {}); // name-gate submit was the user gesture that unlocks autoplay
}

// ---------------- Mobile touch controls (virtual joystick + interact button) ----------------
function setupTouchControls() {
  const zone = document.getElementById("joystick-zone");
  const knob = document.getElementById("joystick-knob");
  const interactBtn = document.getElementById("interact-btn");
  if (!zone || !knob || !interactBtn) return; // elements not added to this page yet

  const maxDist = 32;
  let dragging = false,
    startX = 0,
    startY = 0;

  zone.addEventListener(
    "touchstart",
    (e) => {
      dragging = true;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    },
    { passive: true },
  );

  zone.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      let dx = t.clientX - startX,
        dy = t.clientY - startY;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      knob.style.left = 32 + dx + "px";
      knob.style.top = 32 + dy + "px";
      touchDX = dx / maxDist;
      touchDY = dy / maxDist;
    },
    { passive: true },
  );

  const reset = () => {
    dragging = false;
    touchDX = 0;
    touchDY = 0;
    knob.style.left = "32px";
    knob.style.top = "32px";
  };
  zone.addEventListener("touchend", reset);
  zone.addEventListener("touchcancel", reset);

  interactBtn.addEventListener("click", tryInteract);
}

// ---------------- Scene switching ----------------
function goToScene(key) {
  Popup.close();
  const prevDef = currentSceneKey
    ? window.Rooms.getScene(currentSceneKey)
    : null;
  if (prevDef && prevDef.onExit) prevDef.onExit();

  currentSceneKey = key;
  const def = window.Rooms.getScene(key);

  stageEl.className = def.cssClass;
  hotspotsEl.innerHTML = "";
  decorEl.innerHTML = "";

  currentHotspots = def.hotspots.map((h, i) => {
    const el = document.createElement("div");
    el.className = "hotspot " + h.className;
    el.style.left = h.x;
    el.style.top = h.y;
    el.style.animationDelay = i * 0.12 + "s";
    if (h.rotate) el.style.transform = `rotate(${h.rotate}deg)`;
    if (h.render) h.render(el);
    hotspotsEl.appendChild(el);
    return { ...h, el };
  });

  if (def.decor) def.decor(decorEl);
  if (def.onEnter) def.onEnter();

  const spawn = def.spawn || { x: viewW / 2, y: viewH * 0.8 };
  playerPos = { x: spawn.x === "center" ? viewW / 2 : spawn.x, y: spawn.y };
}

// ---------------- Movement loop ----------------
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (!popupOpen) {
    let dx = touchDX,
      dy = touchDY;
    if (keys["ArrowLeft"] || keys["a"]) dx -= 1;
    if (keys["ArrowRight"] || keys["d"]) dx += 1;
    if (keys["ArrowUp"] || keys["w"]) dy -= 1;
    if (keys["ArrowDown"] || keys["s"]) dy += 1;
    const len = Math.hypot(dx, dy) || 1;
    playerPos.x = clamp(
      playerPos.x + (dx / len) * PLAYER_SPEED * dt,
      0,
      viewW - PLAYER_SIZE,
    );
    playerPos.y = clamp(
      playerPos.y + (dy / len) * PLAYER_SPEED * dt,
      60,
      viewH - PLAYER_SIZE - 20,
    );
    playerEl.style.left = playerPos.x + "px";
    playerEl.style.top = playerPos.y + "px";
    updateProximity();
  }

  requestAnimationFrame(loop);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

let nearHotspot = null;
function updateProximity() {
  const px = playerPos.x + PLAYER_SIZE / 2,
    py = playerPos.y + PLAYER_SIZE / 2;
  let found = null;
  for (const h of currentHotspots) {
    const rect = h.el.getBoundingClientRect();
    const hx = rect.left + rect.width / 2,
      hy = rect.top + rect.height / 2;
    const d = Math.hypot(px - hx, py - hy);
    const reach = Math.max(rect.width, rect.height) / 2 + 40;
    if (d < reach) {
      found = h;
      break;
    }
  }
  nearHotspot = found;
  const interactBtn = document.getElementById("interact-btn");
  if (found) {
    if (found.locked) {
      promptEl.textContent = "locked — for now";
      if (interactBtn) interactBtn.classList.remove("visible");
    } else {
      promptEl.textContent = "[ E ] " + found.promptText;
      if (interactBtn) {
        interactBtn.textContent = found.promptText;
        interactBtn.classList.add("visible");
      }
    }
    promptEl.classList.add("visible");
  } else {
    promptEl.classList.remove("visible");
    if (interactBtn) interactBtn.classList.remove("visible");
  }
}

function tryInteract() {
  if (popupOpen) return;
  if (!nearHotspot || nearHotspot.locked) return;
  nearHotspot.onInteract();
}

// ---------------- Popup (bottom sheet) ----------------
const Popup = {
  open(title, renderFn) {
    popupOpen = true;
    document.getElementById("popup-title").textContent = title;
    const body = document.getElementById("popup-body");
    body.innerHTML = "";
    renderFn(body);
    document.getElementById("popup").classList.remove("hidden");
  },
  close() {
    popupOpen = false;
    document.getElementById("popup").classList.add("hidden");
  },
};

// ---------------- Lightbox (full-screen blurred photo view) ----------------
const Lightbox = {
  open(src) {
    popupOpen = true;
    document.getElementById("lightbox-img").src = src;
    document.getElementById("lightbox").classList.remove("hidden");
  },
  close() {
    popupOpen = false;
    document.getElementById("lightbox").classList.add("hidden");
  },
};

window.Popup = Popup;
window.Lightbox = Lightbox;
window.goToScene = goToScene;

window.addEventListener("DOMContentLoaded", boot);
