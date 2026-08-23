// ============================================================
// Every scene = cssClass + hotspots[] + optional decor(container).
// Hotspots describe WHERE things are and WHAT happens on interact.
// Popup content builders live at the bottom of this file.
// ============================================================

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function pct(v) {
  return v + "%";
}
function scatterPositions(
  count,
  { minX, maxX, minY, maxY, minDist, avoidCenter },
) {
  const points = [];
  let attempts = 0;
  while (points.length < count && attempts < count * 300) {
    attempts++;
    const candidate = {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    };
    const tooCloseToPoints = points.some(
      (p) => Math.hypot(p.x - candidate.x, p.y - candidate.y) < minDist,
    );
    const tooCloseToCenter =
      avoidCenter &&
      Math.hypot(avoidCenter.x - candidate.x, avoidCenter.y - candidate.y) <
        avoidCenter.radius;
    if (!tooCloseToPoints && !tooCloseToCenter) points.push(candidate);
  }
  while (points.length < count) {
    points.push({
      x: minX + (maxX - minX) * (points.length / count),
      y: (minY + maxY) / 2,
    });
  }
  return points;
}

window.Rooms = {
  getScene(key) {
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const cfg = window.CONFIG;

    if (key === "garden") {
      return {
        cssClass: "scene-garden",
        spawn: { x: vw / 2, y: vh * 0.85 },
        decor: (el) => renderFireflies(el, 14),
        hotspots: [
          doorHotspot("1", pct(14), pct(38), cfg.door1.label, () =>
            window.goToScene("room1"),
          ),
          doorHotspot("2", pct(45), pct(20), cfg.door2.label, () =>
            window.goToScene("room2"),
          ),
          doorHotspot("3", pct(76), pct(38), cfg.door3.label, () =>
            window.goToScene("room3"),
          ),
          doorHotspot("final", pct(45), pct(66), "the last path", () =>
            window.goToScene("final"),
          ),
        ],
      };
    }

    if (key === "room1") {
      const photoPositions = [
        { x: pct(16), y: pct(28), rot: -8 }, // original 1
        { x: pct(46), y: pct(26), rot: 5 }, // original 2
        { x: pct(72), y: pct(22), rot: -4 }, // original 3
        { x: pct(28), y: pct(55), rot: 6 }, // new 4
        { x: pct(58), y: pct(58), rot: -6 }, // new 5
        { x: pct(80), y: pct(60), rot: 4 }, // new 6
      ];
      const captions = [
        "from this cute lil thing..",
        "to somthing pretty like this...",
        "and now maybe like this:)",
        "I'll always love that smile of urs",
        "aye aye ",
        "goodluck ahead in life",
      ];

      const hotspots = cfg.door1.photos.slice(0, 6).map((src, i) => ({
        className: "photo-hotspot",
        x: photoPositions[i].x,
        y: photoPositions[i].y,
        rotate: photoPositions[i].rot,
        promptText: "look",
        render: (el) => {
          el.innerHTML = `
            <div class="photo-inner" style="${src ? `background-image:url('${src}')` : ""}">${src ? "" : "photo"}</div>
            <p class="polaroid-caption-bottom">${escapeHtml(captions[i] || "")}</p>`;
        },
        onInteract: () => openPhoto(src),
      }));
      hotspots.push({
        className: "stand-hotspot",
        x: pct(45),
        y: pct(78),
        promptText: "answer something",
        render: (el) => {
          el.textContent = "💭";
        },
        onInteract: () => openQAPopup(),
      });
      hotspots.push(exitHotspot(pct(4), pct(46), "1"));
      return {
        cssClass: "scene-room1",
        spawn: { x: vw * 0.5, y: vh * 0.85 },
        decor: (el) => {
          renderFireflies(el, 8);
          renderSceneHeading(el, "damn u grew up huh?");
        },
        hotspots,
      };
    }

    if (key === "room2") {
      const centerX = 50,
        centerY = 45;
      const memoryPositions = scatterPositions(cfg.door2.memories.length, {
        minX: 8,
        maxX: 90,
        minY: 12,
        maxY: 70,
        minDist: 14,
        avoidCenter: { x: centerX, y: centerY, radius: 18 },
      });

      const hotspots = cfg.door2.memories.slice(0, 7).map((line, i) => ({
        className: "plaque-hotspot",
        x: pct(memoryPositions[i].x),
        y: pct(memoryPositions[i].y),
        promptText: "read",
        render: (el) => {
          el.textContent = "✦";
        },
        onInteract: () => openMemoryPopup(line),
      }));
      hotspots.push({
        className: "stand-hotspot",
        x: pct(centerX),
        y: pct(centerY),
        promptText: "try the puzzle",
        render: (el) => {
          el.textContent = "🔤";
        },
        onInteract: () => openPuzzlePopup(),
      });
      hotspots.push(exitHotspot(pct(4), pct(46), "2"));
      return {
        cssClass: "scene-room2",
        spawn: { x: vw * 0.5, y: vh * 0.85 },
        decor: (el) => renderFireflies(el, 8),
        hotspots,
      };
    }

    if (key === "room3") {
      const partyPhotos = ["assets/party1.jpeg", "assets/party2.jpeg"];
      const partyCaptions = [
        "Do some hard work but also take care of yourself, oky?", // caption for party1.jpeg
        "Dont loose that smile of yours!, id kill to see it again!", // caption for party2.jpeg
      ];
      const partyPhotoPositions = [
        { x: pct(15), y: pct(40), rot: -6 },
        { x: pct(75), y: pct(40), rot: 5 },
      ];

      const partyPhotoHotspots = partyPhotos.map((src, i) => ({
        className: "photo-hotspot",
        x: partyPhotoPositions[i].x,
        y: partyPhotoPositions[i].y,
        rotate: partyPhotoPositions[i].rot,
        promptText: "look",
        render: (el) => {
          el.innerHTML = `
        <div class="photo-inner" style="${src ? `background-image:url('${src}')` : ""}">${src ? "" : "photo"}</div>
        <p class="polaroid-caption-bottom">${escapeHtml(partyCaptions[i] || "")}</p>`;
        },
        onInteract: () => openPhoto(src),
      }));

      const hotspots = [
        {
          className: "cake-hotspot",
          x: pct(45),
          y: pct(45),
          promptText: "make a wish",
          render: (el) => renderCake(el),
          onInteract: () => openPartyPopup(),
        },
        exitHotspot(pct(4), pct(46), "3"),
        ...partyPhotoHotspots,
      ];
      return {
        cssClass: "scene-room3",
        spawn: { x: vw * 0.5, y: vh * 0.85 },
        decor: (el) => {
          renderBalloons(el, 22);
          renderAmbientConfetti(el, 18);
        },
        hotspots,
      };
    }

    if (key === "final") {
      return {
        cssClass: "scene-final",
        spawn: { x: vw * 0.5, y: vh * 0.85 },
        decor: (el) => renderFireflies(el, 10),
        hotspots: [
          {
            className: "stand-hotspot",
            x: pct(48),
            y: pct(45),
            promptText: "read",
            render: (el) => {
              el.textContent = "📜";
            },
            onInteract: () => openFinalPopup(),
          },
          exitHotspot(pct(4), pct(46), "final"),
        ],
      };
    }
  },
};

// ---------------- hotspot factories ----------------
function doorHotspot(key, x, y, label, onOpen) {
  const state = window.doorState[key];
  return {
    className: "door-hotspot" + (state.unlocked ? "" : " locked"),
    x,
    y,
    locked: !state.unlocked,
    promptText: "enter " + label,
    render: (el) => {
      el.innerHTML = `<span>${escapeHtml(label)}</span>`;
    },
    onInteract: onOpen,
  };
}

function exitHotspot(x, y, doorKey) {
  return {
    className: "exit-hotspot",
    x,
    y,
    promptText: "leave",
    render: (el) => {
      el.textContent = "←";
    },
    onInteract: () => {
      window.doorState[doorKey].done = true;
      if (doorKey === "1") window.doorState[2].unlocked = true;
      if (doorKey === "2") window.doorState[3].unlocked = true;
      if (doorKey === "3") window.doorState.final.unlocked = true;
      window.goToScene("garden");
    },
  };
}

// ---------------- decor renderers ----------------
function renderFireflies(container, count) {
  for (let i = 0; i < count; i++) {
    const f = document.createElement("div");
    f.className = "firefly";
    f.style.left = Math.random() * window.innerWidth + "px";
    f.style.top = Math.random() * window.innerHeight + "px";
    f.style.animationDelay = Math.random() * 6 + "s";
    f.style.animationDuration = 6 + Math.random() * 6 + "s";
    container.appendChild(f);
  }
}

function renderSceneHeading(container, text) {
  const h = document.createElement("div");
  h.className = "scene-heading";
  h.textContent = text;
  container.appendChild(h);
}

function renderBalloons(container, count) {
  const colors = ["#ff8fc7", "#5ee9d4", "#b98af0", "#f3d38a"];
  for (let i = 0; i < count; i++) {
    const b = document.createElement("div");
    b.className = "balloon";
    b.style.left = 10 + Math.random() * 80 + "%";
    b.style.top = 8 + Math.random() * 20 + "%";
    b.style.background = colors[i % colors.length];
    b.style.animationDuration = 3 + Math.random() * 2 + "s";
    b.style.animationDelay = Math.random() * 2 + "s";
    container.appendChild(b);
  }
}

function renderAmbientConfetti(container, count) {
  const colors = ["#5ee9d4", "#b98af0", "#ff8fc7", "#f3d38a"];
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "ambient-confetti";
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 4 + Math.random() * 4 + "s";
    c.style.animationDelay = Math.random() * 6 + "s";
    container.appendChild(c);
  }
}

function renderCake(el) {
  el.innerHTML = `
    <div class="cake">
      <div class="candle-mini"><div class="flame-mini" id="cake-flame"></div></div>
      <div class="cake-layer top"><div class="cake-frosting"></div></div>
      <div class="cake-layer"></div>
    </div>  
    <br/>
  `;
}

function launchConfettiBurst() {
  const colors = ["#5ee9d4", "#b98af0", "#ff8fc7", "#f3d38a"];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = 2.5 + Math.random() * 2 + "s";
    piece.style.animationDelay = Math.random() * 0.4 + "s";
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 5200);
  }
}

// ---------------- popup content builders ----------------
function openPhoto(src) {
  if (src) {
    window.Lightbox.open(src);
  } else {
    window.Popup.open("a photo", (body) => {
      body.innerHTML = `<p style="font-size:14px; color:var(--dim);">drop a real photo into /assets and point config.js at it — this one's still a placeholder.</p>`;
    });
  }
}

function openQAPopup() {
  const cfg = window.CONFIG.door1;
  let i = 0;
  window.Popup.open("a question", (body) => {
    const render = () => {
      if (i >= cfg.questions.length) {
        body.innerHTML = `<p class="qa-question">${escapeHtml(cfg.outro)}</p>`;
        return;
      }
      body.innerHTML = `
        <div class="qa-block">
          <p class="qa-question">${escapeHtml(cfg.questions[i])}</p>
          <div class="qa-yesno">
            <button class="next-btn" id="qa-yes">yes</button>
            <button class="next-btn qa-no-btn" id="qa-no">no</button>
          </div>
          <p id="qa-feedback" class="qa-feedback"></p>
        </div>`;
      body.querySelector("#qa-yes").onclick = () => {
        launchConfettiBurst();
        body.querySelector("#qa-feedback").textContent = "🎉";
        setTimeout(() => {
          i++;
          render();
        }, 900);
      };
      body.querySelector("#qa-no").onclick = () => {
        body.querySelector("#qa-feedback").textContent = "think again... 😔";
      };
    };
    render();
  });
}
function openMemoryPopup(line) {
  window.Popup.open("a memory", (body) => {
    body.innerHTML = `<p style="font-size:15px; line-height:1.5;">${escapeHtml(line)}</p>`;
  });
}

function openPuzzlePopup() {
  const cfg = window.CONFIG.door2;
  const answer = (cfg.puzzleWord || "").toUpperCase().trim();
  window.Popup.open("a puzzle", (body) => {
    body.innerHTML = `
      <p style="font-size:13px; color:var(--dim);">${escapeHtml(cfg.puzzleHint)}</p>
      <input type="text" id="puzzle-input" placeholder="type your answer..." />
      <br/><button class="next-btn" id="puzzle-submit">submit</button>
      <p id="puzzle-feedback" class="qa-feedback"></p>`;
    const submit = () => {
      const val = body
        .querySelector("#puzzle-input")
        .value.toUpperCase()
        .trim();
      const feedback = body.querySelector("#puzzle-feedback");
      if (val === answer) {
        launchConfettiBurst();
        feedback.textContent = cfg.puzzleSolvedLine || "yes!! 🎉";
        body.querySelector("#puzzle-input").disabled = true;
        body.querySelector("#puzzle-submit").disabled = true;
      } else {
        feedback.textContent = "nope, try again";
      }
    };
    body.querySelector("#puzzle-submit").onclick = submit;
    body.querySelector("#puzzle-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
  });
}

function openPartyPopup() {
  const cfg = window.CONFIG.door3;
  window.Popup.open("the party", (body) => {
    body.innerHTML = `
      <p style="font-size:14px; color:var(--dim);">blow into your mic to blow out the candle.</p>
      <button id="mic-start-btn" class="next-btn">start</button>
      <div id="mic-level"><div id="mic-level-fill"></div></div>
      <div id="mic-status"></div>
      <div id="party-post"></div>`;
    body.querySelector("#mic-level").style.display = "none";

    body.querySelector("#mic-start-btn").onclick = () => {
      const btn = body.querySelector("#mic-start-btn");
      btn.disabled = true;
      btn.textContent = "listening...";
      body.querySelector("#mic-level").style.display = "block";
      body.querySelector("#mic-status").textContent = "blow into your mic";

      const finishBlow = () => {
        const flame = document.getElementById("cake-flame");
        if (flame) flame.classList.add("out");
        body.querySelector("#mic-status").textContent = "nice.";
        body.querySelector("#party-post").innerHTML =
          `<p style="margin-top:14px;">${escapeHtml(cfg.cakeMessage)}</p>`;
        launchConfettiBurst();
      };

      window.Mic.startCandleListener({
        onLevel: (level) => {
          body.querySelector("#mic-level-fill").style.width =
            Math.min(100, level * 140) + "%";
        },
        onBlow: finishBlow,
        onError: () => {
          body.querySelector("#mic-status").innerHTML =
            "can't access mic — tap below instead";
          const fallback = document.createElement("button");
          fallback.className = "next-btn";
          fallback.textContent = "blow (tap)";
          fallback.style.marginTop = "10px";
          fallback.onclick = finishBlow;
          body
            .querySelector("#mic-status")
            .appendChild(document.createElement("br"));
          body.querySelector("#mic-status").appendChild(fallback);
        },
      });
    };
  });
}

function openFinalPopup() {
  const modal = document.getElementById("final-modal");
  const body = document.getElementById("final-modal-body");
  body.innerHTML = `
    <p style="white-space:pre-wrap; line-height:1.6; font-size:14px;">${escapeHtml(window.CONFIG.finalLetter)}</p>
    <textarea class="final-message-input" id="final-message" placeholder="write something back..."></textarea>
    <button id="copy-btn" class="next-btn" style="margin-top:14px;">copy message</button>
    <span id="copy-status" style="margin-left:10px; font-size:13px; color:var(--neon-teal);"></span>
    <br/>
    <button id="gift-btn" class="next-btn" style="margin-top:14px;">reveal your gift</button>
    <p id="gift-text" style="color:var(--gold); margin-top:14px; display:none;"></p>
    <br/><button id="final-modal-close">close</button>`;

  body.querySelector("#copy-btn").onclick = () => {
    const msg = body.querySelector("#final-message").value;
    navigator.clipboard.writeText(msg).then(() => {
      body.querySelector("#copy-status").textContent = "copied!";
      setTimeout(() => {
        body.querySelector("#copy-status").textContent = "";
      }, 2000);
    });
  };

  body.querySelector("#gift-btn").onclick = () => {
    body.querySelector("#gift-text").textContent = window.CONFIG.giftReveal;
    body.querySelector("#gift-text").style.display = "block";
    body.querySelector("#gift-btn").style.display = "none";
  };
  body.querySelector("#final-modal-close").onclick = () =>
    modal.classList.add("hidden");

  modal.classList.remove("hidden");
}
