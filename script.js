/* ============================================
   CONFIGURATION OBJECT
   Edit this ONE object to personalise the entire
   site. Nothing else needs to change.
   ============================================ */
const CONFIG = {
  name: "Simran",
  candleCount: 6,
  blowThreshold: 0.12, // mic volume level (0–1) that counts as blowing
  // How loud does she need to blow? 0.08 = very sensitive, 0.2 = needs a strong blow

  // Personal message shown at the end. \n becomes a new line.
  message: `
  
Happy Birthday, Simran. This one's all yours.`,

  // "Reasons" that voice command "tell me a reason" cycles through
  reasons: [
    "Because you make ordinary days feel special ✨",
    "Because your laugh is genuinely contagious 😄",
    "Because you always show up when it matters 💚",
    "Because you deserve every good thing 🌿",
  ],
};

const sections = document.querySelectorAll(".section");
// querySelectorAll returns a NodeList (like an array) of ALL
// elements matching the CSS selector '.section'

const btnStart = document.getElementById("btn-start");
const btnRestart = document.getElementById("btn-restart");
const finalMessage = document.getElementById("final-message");
const nameSpans = document.querySelectorAll("[data-name]");
// This selects ALL elements that have a data-name attribute.
// We'll use this to inject the name from CONFIG everywhere.

/* ============================================
   SECTION NAVIGATOR
   Core engine of the multi-step journey.
   ============================================ */

/**
 * showSection(n)
 * Hides all sections, then shows section number n.
 *
 * @param {number} n - the section number (1-based, matches data-section)
 */
function showSection(n) {
  // Loop through every section and remove 'active' class
  sections.forEach((sec) => sec.classList.remove("active"));

  // Find the section with data-section="n" and add 'active'
  const target = document.querySelector(`[data-section="${n}"]`);
  if (target) {
    target.classList.add("active");

    // Add the fade-in animation to the content inside
    const content = target.querySelector(".section-content");
    if (content) {
      // Reset animation by removing and re-adding the class
      // (browser won't replay an animation if the class was already there)
      content.classList.remove("fade-in-up");
      // void content.offsetWidth forces a browser "reflow" — this is a
      // known trick to reset CSS animations without setTimeout
      void content.offsetWidth;
      content.classList.add("fade-in-up");
    }
  }
}

/* ============================================
   INITIALISE NAME
   Replace [data-name] placeholders with CONFIG.name
   ============================================ */
function initName() {
  nameSpans.forEach((span) => {
    span.textContent = CONFIG.name;
  });
}

/* ============================================
   INITIALISE FINAL MESSAGE
   Fills the final message div from CONFIG
   ============================================ */
function initFinalMessage() {
  // Split on newlines and wrap each paragraph in a <p> tag
  // so line breaks render correctly in HTML
  const paragraphs = CONFIG.message
    .split("\n")
    .filter((line) => line.trim() !== "") // remove empty lines
    .map((line) => `<p>${line.trim()}</p>`)
    .join("");

  finalMessage.innerHTML = paragraphs;
}

/* ============================================
   EVENT LISTENERS
   An event listener says: "when THIS happens
   on THIS element, run THIS function."
   
   addEventListener(eventType, callback)
   - eventType: 'click', 'keydown', 'input', etc.
   - callback: the function to run
   ============================================ */

// "Open Your Surprise" button → go to section 2
btnStart.addEventListener("click", () => {
  showSection(2);
});

// "From the Beginning" button → back to section 1
btnRestart.addEventListener("click", () => {
  showSection(1);
  // Later we'll also reset mic, camera, etc. here
});

/* ============================================
   BOOT — runs when the page first loads
   ============================================ */
function init() {
  initName();
  initFinalMessage();
  // Section 1 is already active via HTML class,
  // but we call showSection to run the fade-in animation
  showSection(1);

  console.log("🎂 Birthday site booted for:", CONFIG.name);
  // console.log() prints to the browser DevTools console.
  // Open it with F12 → Console tab. Great for debugging.
}

// This runs init() immediately when the script loads.
// Since our <script> tag is at the bottom of <body>,
// all HTML elements already exist by this point.
init();
