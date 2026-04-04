# 🎂 Happy Birthday Simran

An interactive birthday website with particles, cake blowing, photo booth, voice commands, and music visualizer.

---

## 📦 Dependencies

Only ONE dev dependency — **Vite** (local dev server). Everything else loads from CDN.

```
vite — local dev server with hot reload + handles CORS for mic/camera/audio
canvas-confetti — confetti bursts (loaded via CDN, no install needed)
Google Fonts — Cormorant Garamond + DM Sans (loaded via CDN)
```

---

## 🚀 Setup & Run

### 1. Install dependencies

```bash
npm install
```

This installs Vite. Takes ~10 seconds. Creates a `node_modules` folder (don't touch it).

### 2. Start dev server

```bash
npm run dev
```

Opens at **http://localhost:5173**

✅ Hot reload — save a file → browser updates instantly  
✅ CORS fixed — mic, camera, and audio all work  
✅ No file:// errors

### 3. Build for production (before deploying)

```bash
npm run build
```

Creates a `dist/` folder — upload this to Netlify.

---

## 🎵 Adding the Birthday Song

1. Find a royalty-free "Happy Birthday" MP3 (e.g. from pixabay.com)
2. Create a folder called `audio/` in this project
3. Drop the file in and name it `happy-birthday.mp3`
4. The visualizer will automatically use it

Without the file, everything else still works — the visualizer just runs silently.

---

## 🎨 Personalisation

Open `script.js` and edit the `CONFIG` object at the top:

```js
const CONFIG = {
  name: "Simran", // ← change name here
  candleCount: 6, // ← number of candles
  cutsNeeded: 5, // ← clicks to slice cake
  blowThreshold: 0.11, // ← mic sensitivity (lower = easier to blow)
  message: `Your personal message here`,
  reasons: ["Reason 1", "Reason 2"],
};
```

To change the color theme, edit the `:root` variables at the top of `style.css`.

---

## 📁 File Structure

```
birthday-simran/
├── index.html      ← structure (all 6 sections)
├── style.css       ← pistachio theme + all component styles
├── script.js       ← all features (particles, mic, camera, voice, visualizer)
├── package.json    ← only dependency: vite
├── audio/
│   └── happy-birthday.mp3   ← add this yourself
└── README.md
```

---

## ✨ Features

| Feature                          | API Used                      |
| -------------------------------- | ----------------------------- |
| Floating particles + mouse trail | Canvas 2D API                 |
| Click-to-pop with confetti       | canvas-confetti               |
| Candle blowing detection         | getUserMedia + Web Audio API  |
| Click-to-cut cake                | DOM events + CSS animations   |
| Photo booth with filters         | getUserMedia (video) + Canvas |
| Voice commands                   | Web Speech API                |
| Music visualizer                 | Web Audio API (AnalyserNode)  |
| Final message + selfie           | DOM + canvas-confetti         |

---

## 🌐 Deploy to Netlify

1. Run `npm run build`
2. Go to netlify.com → "Add new site" → "Deploy manually"
3. Drag the `dist/` folder into Netlify
4. Share the URL 🎉
