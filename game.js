// Cozy Bloom Game Engine (Vanilla JS)

// Constants
const COLS = 6;
const ROWS = 4;
const TOTAL_PLOTS = COLS * ROWS;
const SAVE_KEY = "onekey-garden-save-v1";
const TUTORIAL_DONE_KEY = "cozy-bloom-tutorial-done";

const FLOWERS = ["daisy", "tulip", "sunflower", "lavender", "glowbloom"];

const FLOWER_INFO = {
  daisy: { name: "Daisy", emoji: "🌼", colors: ["#fef9c3", "#facc15"], petals: 8, cost: 3, reward: 7 },
  tulip: { name: "Tulip", emoji: "🌷", colors: ["#fbcfe8", "#ec4899"], petals: 5, cost: 5, reward: 11 },
  sunflower: { name: "Sunflower", emoji: "🌻", colors: ["#fde68a", "#d97706"], petals: 12, cost: 8, reward: 18 },
  lavender: { name: "Lavender", emoji: "💜", colors: ["#ddd6fe", "#7c3aed"], petals: 6, cost: 12, reward: 27 },
  glowbloom: { name: "Glowbloom", emoji: "✨", colors: ["#a7f3d0", "#10b981"], petals: 8, magical: true, cost: 20, reward: 50 }
};

const DECOR_INFO = {
  bench: { name: "Bench", emoji: "🪑", cost: 15 },
  pond: { name: "Pond", emoji: "🪷", cost: 30 },
  lantern: { name: "Lantern", emoji: "🏮", cost: 20 }
};

const CRITTER_INFO = {
  butterfly: { name: "Butterfly", emoji: "🦋" },
  bee: { name: "Bee", emoji: "🐝" },
  bird: { name: "Bird", emoji: "🐦" }
};

const TUTORIAL_STEPS = [
  {
    title: "Welcome to Cozy Bloom",
    body: "This is your garden. You only have one key: the spacebar. That's it.",
    hint: "Press SPACE to continue"
  },
  {
    title: "Moving the cursor",
    body: "Tap SPACE to move your cursor one plot forward across the garden grid.",
    hint: "Press SPACE to continue"
  },
  {
    title: "Planting",
    body: "When your cursor is on an empty plot, tap SPACE to plant the selected flower. Flowers cost coins.",
    hint: "Press SPACE to continue"
  },
  {
    title: "Switching tools",
    body: "Double-tap SPACE to cycle between tools: Plant → Water → Harvest → Decorate.",
    hint: "Press SPACE to continue"
  },
  {
    title: "Watering & Harvesting",
    body: "Water your flowers or they'll wilt. When a flower fully blooms, switch to Harvest and tap to collect coins. Hold SPACE to water everything at once.",
    hint: "Press SPACE to continue"
  },
  {
    title: "That's all!",
    body: "Triple-tap SPACE at any time to open your garden journal. Enjoy the garden.",
    hint: "Press SPACE to start gardening"
  }
];

// State
let save = loadGameSave();
let tool = "plant"; // plant, water, harvest, decorate
let flowerSel = "daisy";
let decorSel = "bench";
let cursorIdx = 0;
let holdProgress = 0;
let critters = [];
let toasts = [];
let splash = true;
let tutorialStep = localStorage.getItem(TUTORIAL_DONE_KEY) ? null : 0;

// Refs
let tapTimer = null;
let tapCount = 0;
let holdTimer = null;
let holding = false;
let holdStartTime = 0;
let audioCtx = null;

// Hills SVG Drawing helper
function drawHills() {
  const container = document.getElementById("hills-container");
  if (!container) return;
  container.innerHTML = `
    <svg viewBox="0 0 100 30" preserveAspectRatio="none">
      <path d="M0 30 Q 20 5, 40 15 T 80 12 T 100 18 L 100 30 Z" fill="#15803d" opacity="0.7" />
      <path d="M0 30 Q 15 18, 35 22 T 70 20 T 100 25 L 100 30 Z" fill="#166534" opacity="0.8" />
    </svg>
  `;
}

// Generate SVG string for Flowers dynamically
function getFlowerSVG(kind, stage, size = 64) {
  const info = FLOWER_INFO[kind];

  if (stage === 0) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 64 64">
        <ellipse cx="32" cy="56" rx="8" ry="3" fill="#000" opacity="0.15" />
        <path d="M30 54 Q32 48 34 54" stroke="#65a30d" stroke-width="3" fill="none" stroke-linecap="round" />
        <circle cx="32" cy="52" r="3" fill="#78350f" />
      </svg>
    `;
  }

  if (stage === 1) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 64 64">
        <ellipse cx="32" cy="58" rx="10" ry="3" fill="#000" opacity="0.15" />
        <path d="M32 58 L32 38" stroke="#16a34a" stroke-width="3" stroke-linecap="round" />
        <ellipse cx="26" cy="44" rx="6" ry="3" fill="#22c55e" transform="rotate(-30 26 44)" />
        <ellipse cx="38" cy="44" rx="6" ry="3" fill="#22c55e" transform="rotate(30 38 44)" />
      </svg>
    `;
  }

  if (stage === 2) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 64 64">
        <ellipse cx="32" cy="58" rx="10" ry="3" fill="#000" opacity="0.15" />
        <path d="M32 58 L32 30" stroke="#16a34a" stroke-width="3" stroke-linecap="round" />
        <ellipse cx="26" cy="42" rx="6" ry="3" fill="#22c55e" transform="rotate(-30 26 42)" />
        <ellipse cx="38" cy="42" rx="6" ry="3" fill="#22c55e" transform="rotate(30 38 42)" />
        <circle cx="32" cy="26" r="6" fill="${info.colors[1]}" />
        <circle cx="32" cy="26" r="3" fill="${info.colors[0]}" />
      </svg>
    `;
  }

  // Stage 3: Full Bloom
  let petals = "";
  for (let i = 0; i < info.petals; i++) {
    const angle = (i / info.petals) * 360;
    petals += `
      <ellipse
        cx="32"
        cy="14"
        rx="5"
        ry="8"
        fill="${info.colors[0]}"
        stroke="${info.colors[1]}"
        stroke-width="1"
        transform="rotate(${angle} 32 22)"
      />
    `;
  }

  const magicGlow = info.magical
    ? `
      <circle cx="32" cy="22" r="14" fill="${info.colors[1]}" opacity="0.25">
        <animate attributeName="r" values="13;17;13" dur="2s" repeatCount="indefinite" />
      </circle>
    `
    : "";

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" class="anim-sway">
      <ellipse cx="32" cy="60" rx="12" ry="3" fill="#000" opacity="0.18" />
      <path d="M32 60 L32 32" stroke="#16a34a" stroke-width="3" stroke-linecap="round" />
      <ellipse cx="24" cy="44" rx="7" ry="3.5" fill="#22c55e" transform="rotate(-30 24 44)" />
      <ellipse cx="40" cy="44" rx="7" ry="3.5" fill="#22c55e" transform="rotate(30 40 44)" />
      ${magicGlow}
      ${petals}
      <circle cx="32" cy="22" r="4.5" fill="${info.colors[1]}" />
      <circle cx="31" cy="21" r="1.5" fill="white" opacity="0.7" />
    </svg>
  `;
}

// Generate SVG string for decorations
function getDecorSVG(kind, size = 48) {
  if (kind === "bench") {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 48 48">
        <rect x="8" y="24" width="32" height="6" rx="2" fill="#b45309" />
        <rect x="8" y="12" width="6" height="18" rx="2" fill="#92400e" />
        <rect x="34" y="12" width="6" height="18" rx="2" fill="#92400e" />
        <rect x="12" y="30" width="4" height="10" fill="#78350f" />
        <rect x="32" y="30" width="4" height="10" fill="#78350f" />
      </svg>
    `;
  }
  if (kind === "pond") {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 48 48">
        <ellipse cx="24" cy="32" rx="20" ry="8" fill="#38bdf8" stroke="#0284c7" stroke-width="2" />
        <path d="M16 30 C 14 26, 12 34, 18 32 C 22 30, 24 34, 26 30" fill="none" stroke="#22c55e" stroke-width="2" />
        <circle cx="28" cy="30" r="3" fill="#ec4899" />
      </svg>
    `;
  }
  // lantern
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48">
      <line x1="24" y1="4" x2="24" y2="16" stroke="#475569" stroke-width="2" />
      <path d="M16 16 L32 16 L28 32 L20 32 Z" fill="#fef08a" stroke="#dc2626" stroke-width="2" />
      <rect x="18" y="32" width="12" height="4" fill="#991b1b" />
      <circle cx="24" cy="24" r="5" fill="#facc15" opacity="0.8" />
    </svg>
  `;
}

// Synthesizer Web Audio API
function playChime(freq, duration = 0.2, type = "sine", vol = 0.05) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtx;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.value = 0;
    gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Audio Context init warning:", e);
  }
}

// Push toast notifications
function pushToast(msg) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const id = Math.random().toString(36).substring(2, 9);
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.id = id;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

// Game Save managers
function loadGameSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultSave();
    return JSON.parse(raw);
  } catch {
    return createDefaultSave();
  }
}

function createDefaultSave() {
  return {
    plants: [],
    decor: [],
    coins: 50,
    day: 1,
    timeOfDay: 0.3,
    weather: "clear",
    discovered: {}
  };
}

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

// Render garden grid DOM
function renderGrid() {
  const grid = document.getElementById("garden-grid");
  if (!grid) return;
  grid.innerHTML = "";

  for (let idx = 0; idx < TOTAL_PLOTS; idx++) {
    const x = idx % COLS;
    const y = Math.floor(idx / COLS);
    const plant = save.plants.find((p) => p.x === x && p.y === y);
    const decor = save.decor.find((d) => d.x === x && d.y === y);
    const isCursor = idx === cursorIdx;

    const plot = document.createElement("div");
    plot.className = `plot ${isCursor ? "cursor-active" : ""}`;
    plot.setAttribute("data-idx", idx);

    if (plant) {
      const pDiv = document.createElement("div");
      pDiv.className = "plant-sprite";
      pDiv.innerHTML = getFlowerSVG(plant.kind, plant.stage);
      if (plant.water < 20) {
        const wilt = document.createElement("span");
        wilt.className = "wilt-badge";
        wilt.innerText = "🥀";
        pDiv.appendChild(wilt);
      }
      plot.appendChild(pDiv);
    } else if (decor) {
      const dDiv = document.createElement("div");
      dDiv.className = "decor-sprite";
      dDiv.innerHTML = getDecorSVG(decor.kind);
      plot.appendChild(dDiv);
    }

    grid.appendChild(plot);
  }
}

// Render HUD elements
function renderHUD() {
  document.getElementById("day-counter").innerText = `Day ${save.day}`;
  
  const hours = Math.floor((save.timeOfDay * 24 + 6) % 24);
  document.getElementById("time-counter").innerText = `${hours.toString().padStart(2, "0")}:00`;
  
  document.getElementById("weather-counter").innerText = save.weather === "rain" ? "Rain" : "Clear";
  document.getElementById("coin-counter").innerText = `${save.coins} coins`;

  // Badge letters
  const badgeMap = { plant: "P", water: "W", harvest: "H", decorate: "D" };
  document.getElementById("tool-badge").innerText = badgeMap[tool];
  document.getElementById("tool-name").innerText = tool.charAt(0).toUpperCase() + tool.slice(1);

  // Description updater
  let desc = "";
  if (tool === "plant") {
    const info = FLOWER_INFO[flowerSel];
    desc = `${info.name} · ${info.cost} coins · hold SPACE to switch flower`;
  } else if (tool === "decorate") {
    const info = DECOR_INFO[decorSel];
    desc = `${info.name} · ${info.cost} coins`;
  } else if (tool === "water") {
    desc = "Hold SPACE to water all";
  } else if (tool === "harvest") {
    desc = "Tap on a bloomed flower to harvest";
  }
  document.getElementById("tool-desc").innerText = desc;
}

// Render sky backgrounds, sun/moon positions
function renderCelestial() {
  const backdrop = document.getElementById("sky-backdrop");
  const body = document.getElementById("celestial-body");
  const ground = document.getElementById("ground-layer");
  if (!backdrop || !body) return;

  const time = save.timeOfDay;
  const isNight = time < 0.18 || time > 0.88;

  // Sky gradients
  let skyGrad = "";
  if (save.weather === "rain") {
    skyGrad = "linear-gradient(180deg, #2d3748 0%, #4a5568 50%, #1a202c 100%)";
    ground.style.filter = "brightness(0.7) saturate(0.8)";
  } else {
    if (isNight) {
      skyGrad = "linear-gradient(180deg, #0a081d 0%, #1e1a42 50%, #13132e 100%)";
      ground.style.filter = "brightness(0.65) saturate(0.8)";
    } else if (time < 0.3) { // Dawn
      skyGrad = "linear-gradient(180deg, #fbc2eb 0%, #a6c1ee 50%, #fffbeb 100%)";
      ground.style.filter = "none";
    } else if (time < 0.7) { // Day
      skyGrad = "linear-gradient(180deg, #bae6fd 0%, #e0f2fe 50%, #fffbeb 100%)";
      ground.style.filter = "none";
    } else { // Dusk
      skyGrad = "linear-gradient(180deg, #f59e0b 0%, #ec4899 50%, #581c87 100%)";
      ground.style.filter = "brightness(0.9) saturate(0.9)";
    }
  }
  backdrop.style.background = skyGrad;

  // Sun / Moon positioning math
  const x = time * 100;
  const y = 30 + Math.sin(time * Math.PI) * -25;
  body.style.left = `${x}%`;
  body.style.top = `${y}%`;

  if (isNight) {
    body.className = "night-celestial";
  } else {
    body.className = "day-celestial";
  }

  // Twinkle stars render
  renderStars(isNight);
}

// Generate stars
function renderStars(isNight) {
  const container = document.getElementById("stars-container");
  if (!container) return;
  if (!isNight || save.weather === "rain") {
    container.innerHTML = "";
    return;
  }
  if (container.children.length > 0) return; // Already rendered stars

  for (let i = 0; i < 40; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    const size = 1 + Math.random() * 2;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.animationDelay = `${Math.random() * 2}s`;
    container.appendChild(star);
  }
}

// Render rain drops
function renderRain() {
  const layer = document.getElementById("weather-layer");
  if (!layer) return;
  if (save.weather !== "rain") {
    layer.innerHTML = "";
    return;
  }
  if (layer.children.length > 0) return;

  for (let i = 0; i < 50; i++) {
    const drop = document.createElement("div");
    drop.className = "rain-drop";
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${0.6 + Math.random() * 0.4}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    layer.appendChild(drop);
  }
}

// Discovery Journal builder
function renderJournal() {
  const flowersGrid = document.getElementById("journal-flowers");
  const wildlifeGrid = document.getElementById("journal-wildlife");
  if (!flowersGrid || !wildlifeGrid) return;

  flowersGrid.innerHTML = "";
  FLOWERS.forEach((k) => {
    const seen = save.discovered[k];
    const info = FLOWER_INFO[k];
    const item = document.createElement("div");
    item.className = "journal-item";
    item.innerHTML = `
      <div class="item-emoji">${seen ? info.emoji : "❓"}</div>
      <div class="item-name">${seen ? info.name : "???"}</div>
    `;
    flowersGrid.appendChild(item);
  });

  wildlifeGrid.innerHTML = "";
  Object.keys(CRITTER_INFO).forEach((k) => {
    const seen = save.discovered[k];
    const info = CRITTER_INFO[k];
    const item = document.createElement("div");
    item.className = "journal-item";
    item.innerHTML = `
      <div class="item-emoji">${seen ? info.emoji : "❓"}</div>
      <div class="item-name">${seen ? info.name : "???"}</div>
    `;
    wildlifeGrid.appendChild(item);
  });
}

// Critter Spawning and Physics Loop
function updateCritters() {
  const layer = document.getElementById("critters-layer");
  if (!layer) return;

  // Flight calculations
  critters.forEach((c) => {
    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) {
      c.targetX = c.x + (Math.random() * 20 - 10);
      c.targetY = Math.max(20, Math.min(85, c.y + (Math.random() * 20 - 10)));
    } else {
      c.x += (dx / dist) * c.speed;
      c.y += (dy / dist) * c.speed;
    }

    const cDiv = document.getElementById(`critter-${c.id}`);
    if (cDiv) {
      cDiv.style.left = `${c.x}%`;
      cDiv.style.top = `${c.y}%`;
    }
  });

  requestAnimationFrame(updateCritters);
}

function spawnCritter() {
  const bloomedPlants = save.plants.filter((p) => p.stage === 3);
  if (bloomedPlants.length === 0 || critters.length > 4) return;

  const speciesList = Object.keys(CRITTER_INFO);
  const kind = speciesList[Math.floor(Math.random() * speciesList.length)];
  const anchor = bloomedPlants[Math.floor(Math.random() * bloomedPlants.length)];
  
  const gridX = (anchor.x / COLS) * 100 + 5;
  const gridY = 45 + (anchor.y / ROWS) * 45;

  const critter = {
    id: Math.random().toString(36).substring(2, 9),
    kind,
    x: gridX + (Math.random() * 10 - 5),
    y: gridY + (Math.random() * 10 - 5),
    targetX: gridX + (Math.random() * 20 - 10),
    targetY: gridY + (Math.random() * 20 - 10),
    speed: 0.2 + Math.random() * 0.3
  };

  critters.push(critter);

  // Render critter node
  const layer = document.getElementById("critters-layer");
  const cDiv = document.createElement("div");
  cDiv.id = `critter-${critter.id}`;
  cDiv.className = "critter";
  cDiv.style.left = `${critter.x}%`;
  cDiv.style.top = `${critter.y}%`;
  cDiv.innerText = CRITTER_INFO[kind].emoji;
  layer.appendChild(cDiv);

  // Discover wildlife
  if (!save.discovered[kind]) {
    save.discovered[kind] = true;
    saveState();
  }

  // De-spawn after 12 seconds
  setTimeout(() => {
    cDiv.remove();
    critters = critters.filter((x) => x.id !== critter.id);
  }, 12000);
}

// Action operations
function advanceCursor() {
  cursorIdx = (cursorIdx + 1) % TOTAL_PLOTS;
  playChime(300, 0.05, "sine", 0.02);
  renderGrid();
}

function cycleTool() {
  const order = ["plant", "water", "harvest", "decorate"];
  tool = order[(order.indexOf(tool) + 1) % order.length];
  pushToast(`Tool: ${tool.toUpperCase()}`);
  renderHUD();
}

function cycleFlower() {
  const idx = FLOWERS.indexOf(flowerSel);
  flowerSel = FLOWERS[(idx + 1) % FLOWERS.length];
  pushToast(`Flower: ${FLOWER_INFO[flowerSel].name}`);
  renderHUD();
}

function cycleDecor() {
  const list = Object.keys(DECOR_INFO);
  const idx = list.indexOf(decorSel);
  decorSel = list[(idx + 1) % list.length];
  pushToast(`Decor: ${DECOR_INFO[decorSel].name}`);
  renderHUD();
}

function performTap() {
  const x = cursorIdx % COLS;
  const y = Math.floor(cursorIdx / COLS);
  const currentPlant = save.plants.find((p) => p.x === x && p.y === y);

  if (tool === "plant") {
    if (currentPlant) {
      pushToast("Plot is occupied");
      playChime(200, 0.1, "triangle");
      return;
    }
    const info = FLOWER_INFO[flowerSel];
    if (save.coins < info.cost) {
      pushToast("Need coins");
      playChime(150, 0.15, "square");
      return;
    }
    save.plants.push({
      x, y,
      kind: flowerSel,
      stage: 0,
      water: 50,
      plantedAt: Date.now(),
      lastGrow: Date.now()
    });
    save.coins -= info.cost;
    save.discovered[flowerSel] = true;
    playChime(600, 0.15);
    pushToast(`Planted ${info.name}`);
  } 
  
  else if (tool === "water") {
    if (!currentPlant) {
      pushToast("Nothing here");
      return;
    }
    currentPlant.water = Math.min(100, currentPlant.water + 30);
    playChime(500, 0.1, "sine");
    pushToast("Watered 🌱");
  } 
  
  else if (tool === "harvest") {
    if (!currentPlant || currentPlant.stage !== 3) {
      pushToast("Not ready");
      return;
    }
    const reward = FLOWER_INFO[currentPlant.kind].reward;
    save.plants = save.plants.filter((p) => !(p.x === x && p.y === y));
    save.coins += reward;
    playChime(800, 0.2);
    pushToast(`+${reward} coins 🌸`);
  } 
  
  else if (tool === "decorate") {
    if (currentPlant) {
      pushToast("Plot has plant");
      return;
    }
    const existingDecor = save.decor.find((d) => d.x === x && d.y === y);
    if (existingDecor) {
      save.decor = save.decor.filter((d) => !(d.x === x && d.y === y));
      save.coins += Math.floor(DECOR_INFO[existingDecor.kind].cost / 2);
      pushToast(`Removed ${DECOR_INFO[existingDecor.kind].name}`);
    } else {
      const cost = DECOR_INFO[decorSel].cost;
      if (save.coins < cost) {
        pushToast("Need coins");
        return;
      }
      save.decor.push({ kind: decorSel, x, y });
      save.coins -= cost;
      playChime(400, 0.15, "triangle");
      pushToast(`Placed ${DECOR_INFO[decorSel].name}`);
    }
  }

  saveState();
  renderGrid();
  renderHUD();
}

function handleHoldComplete() {
  if (tool === "water") {
    save.plants.forEach((p) => {
      p.water = Math.min(100, p.water + 30);
    });
    pushToast("Watered all flowers 💧");
    playChime(680, 0.35, "sine");
  } else if (tool === "plant") {
    cycleFlower();
  } else if (tool === "decorate") {
    cycleDecor();
  } else {
    // move vertical cursor skip
    cursorIdx = (cursorIdx + COLS) % TOTAL_PLOTS;
    playChime(300, 0.05, "sine", 0.02);
  }
  saveState();
  renderGrid();
  renderHUD();
}

// Tutorial Overlay manager
function advanceTutorial() {
  if (tutorialStep === null) return;
  tutorialStep++;
  if (tutorialStep >= TUTORIAL_STEPS.length) {
    localStorage.setItem(TUTORIAL_DONE_KEY, "1");
    tutorialStep = null;
    document.getElementById("tutorial-overlay").classList.add("hidden");
  } else {
    const step = TUTORIAL_STEPS[tutorialStep];
    document.getElementById("tutorial-step-tag").innerText = `Step ${tutorialStep + 1} of ${TUTORIAL_STEPS.length}`;
    document.getElementById("tutorial-title").innerText = step.title;
    document.getElementById("tutorial-body").innerText = step.body;
    document.getElementById("next-tutorial").innerText = step.hint;
  }
}

// Spacebar Listener
window.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  e.preventDefault();

  if (splash) {
    splash = false;
    document.getElementById("splash-screen").classList.add("hidden");
    if (tutorialStep !== null) {
      document.getElementById("tutorial-overlay").classList.remove("hidden");
      advanceTutorial(); // init step 1
    }
    return;
  }

  if (tutorialStep !== null) {
    advanceTutorial();
    return;
  }

  if (holding) return;
  holding = true;
  holdStartTime = Date.now();
  holdProgress = 0;

  document.getElementById("charge-bar-container").classList.remove("hidden");

  holdTimer = setInterval(() => {
    const progress = Math.min(1, (Date.now() - holdStartTime) / 750);
    holdProgress = progress;
    document.getElementById("charge-progress").style.width = `${progress * 100}%`;
    if (progress >= 1 && holdTimer) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
  }, 30);
});

window.addEventListener("keyup", (e) => {
  if (e.code !== "Space") return;
  e.preventDefault();

  if (tutorialStep !== null || splash) return;

  if (!holding) return;
  holding = false;

  const wasHeld = holdProgress >= 1;
  if (holdTimer) {
    clearInterval(holdTimer);
    holdTimer = null;
  }
  document.getElementById("charge-bar-container").classList.add("hidden");
  document.getElementById("charge-progress").style.width = "0%";

  if (wasHeld) {
    handleHoldComplete();
    return;
  }

  tapCount += 1;
  if (tapTimer) {
    clearTimeout(tapTimer);
  }

  tapTimer = setTimeout(() => {
    const count = tapCount;
    tapCount = 0;

    if (count === 1) {
      performTap();
      advanceCursor();
    } else if (count === 2) {
      cycleTool();
    } else if (count >= 3) {
      // Toggle Journal Modal
      const modal = document.getElementById("journal-overlay");
      if (modal.classList.contains("hidden")) {
        renderJournal();
        modal.classList.remove("hidden");
      } else {
        modal.classList.add("hidden");
      }
    }
  }, 260);
});

// Click fallback events for buttons
document.getElementById("start-button").addEventListener("click", () => {
  splash = false;
  document.getElementById("splash-screen").classList.add("hidden");
  if (tutorialStep !== null) {
    document.getElementById("tutorial-overlay").classList.remove("hidden");
    advanceTutorial();
  }
});

document.getElementById("skip-tutorial").addEventListener("click", () => {
  localStorage.setItem(TUTORIAL_DONE_KEY, "1");
  tutorialStep = null;
  document.getElementById("tutorial-overlay").classList.add("hidden");
});

document.getElementById("next-tutorial").addEventListener("click", advanceTutorial);

document.getElementById("close-journal").addEventListener("click", () => {
  document.getElementById("journal-overlay").classList.add("hidden");
});

// Game loop (Time tick, growth and weather changes)
setInterval(() => {
  if (splash || tutorialStep !== null) return;

  save.timeOfDay += 0.002;
  if (save.timeOfDay >= 1) {
    save.timeOfDay -= 1;
    save.day += 1;
  }

  // 1% weather state cycle chance
  if (Math.random() < 0.01) {
    save.weather = Math.random() < 0.3 ? "rain" : "clear";
    renderRain();
  }

  // growth updates
  const now = Date.now();
  save.plants.forEach((p) => {
    const isWatered = p.water > 30;
    const timeToGrow = isWatered ? 6000 : 15000;
    
    if (p.stage < 3 && now - p.lastGrow > timeToGrow) {
      p.stage += 1;
      p.lastGrow = now;
    }

    const waterRate = save.weather === "rain" ? 3 : -0.5;
    p.water = Math.max(0, Math.min(100, p.water + waterRate));
  });

  saveState();
  renderGrid();
  renderHUD();
  renderCelestial();
}, 100);

// Wildlife loop
setInterval(() => {
  if (splash || tutorialStep !== null) return;
  spawnCritter();
}, 3000);

// Run initial renders
drawHills();
renderGrid();
renderHUD();
renderCelestial();
renderRain();
updateCritters();
