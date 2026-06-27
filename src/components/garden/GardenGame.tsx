import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Weather,
  FlowerKind,
  CritterKind,
  DecorKind,
  Stage,
  Plant,
  Critter,
  Save,
  FLOWERS,
  FLOWER_INFO,
  DECOR_INFO,
  CRITTER_INFO,
  SAVE_KEY,
  generateUid,
  loadGameSave,
} from "./types";

import { FlowerSVG } from "./components/FlowerSVG";
import { DecorSVG } from "./components/DecorSVG";
import { Celestial } from "./components/Celestial";
import { Stars } from "./components/Stars";
import { Hills } from "./components/Hills";
import { WeatherFX } from "./components/WeatherFX";
import { GardenJournal } from "./components/GardenJournal";

const COLS = 6;
const ROWS = 4;
const TOTAL_PLOTS = COLS * ROWS;

export function GardenGame() {
  const [save, setSave] = useState<Save>(() => loadGameSave());
  const [tool, setTool] = useState<"plant" | "water" | "decorate" | "harvest">("plant");
  const [flowerSel, setFlowerSel] = useState<FlowerKind>("daisy");
  const [decorSel, setDecorSel] = useState<DecorKind>("bench");
  const [cursorIdx, setCursorIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [splash, setSplash] = useState(true);
  const [holdProgress, setHoldProgress] = useState(0);
  const [critters, setCritters] = useState<Critter[]>([]);
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);

  const tapTimer = useRef<number | null>(null);
  const tapCount = useRef(0);
  const holdTimer = useRef<number | null>(null);
  const holding = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const holdProgressRef = useRef(0);

  useEffect(() => {
    holdProgressRef.current = holdProgress;
  }, [holdProgress]);

  const pushToast = useCallback((msg: string) => {
    const id = generateUid();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2000);
  }, []);

  const playChime = useCallback((freq: number, duration = 0.2, type: OscillatorType = "sine", vol = 0.05) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
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
      console.warn("Audio warning:", e);
    }
  }, []);

  // Save game state helper
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    }, 400);
    return () => clearTimeout(timer);
  }, [save]);

  // Game Loop: Handles Time progress, Weather state, and Plant Growth
  useEffect(() => {
    const interval = setInterval(() => {
      setSave((prev) => {
        let time = prev.timeOfDay + 0.002;
        let day = prev.day;
        let weather = prev.weather;

        if (time >= 1) {
          time -= 1;
          day += 1;
        }

        // 1% chance to change weather
        if (Math.random() < 0.01) {
          weather = Math.random() < 0.3 ? "rain" : "clear";
        }

        const now = Date.now();
        const updatedPlants = prev.plants.map((p) => {
          const isWatered = p.water > 30;
          const timeNeededToGrow = isWatered ? 6000 : 15000;
          let stage = p.stage;
          let lastGrow = p.lastGrow;

          if (stage < 3 && now - p.lastGrow > timeNeededToGrow) {
            stage = (stage + 1) as Stage;
            lastGrow = now;
          }

          // Rain replenishes, sunny decays
          const waterRate = weather === "rain" ? 3 : -0.5;
          return {
            ...p,
            stage,
            lastGrow,
            water: Math.max(0, Math.min(100, p.water + waterRate)),
          };
        });

        return {
          ...prev,
          timeOfDay: time,
          day,
          weather,
          plants: updatedPlants,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Wildlife spawning loop
  useEffect(() => {
    const spawnTimer = setInterval(() => {
      setCritters((prev) => {
        if (prev.length > 5) return prev; // Keep wildlife low for performance

        const bloomedPlants = save.plants.filter((p) => p.stage === 3);
        if (bloomedPlants.length === 0) return prev;

        const species: CritterKind[] = ["butterfly", "bee", "bird"];
        const chosenSpecies = species[Math.floor(Math.random() * species.length)];

        // Spawn close to a bloomed plant
        const anchorPlant = bloomedPlants[Math.floor(Math.random() * bloomedPlants.length)];
        const gridX = (anchorPlant.x / COLS) * 100 + 5;
        const gridY = 45 + (anchorPlant.y / ROWS) * 45;

        const newCritter: Critter = {
          id: generateUid(),
          kind: chosenSpecies,
          x: gridX + (Math.random() * 10 - 5),
          y: gridY + (Math.random() * 10 - 5),
          targetX: gridX + (Math.random() * 20 - 10),
          targetY: gridY + (Math.random() * 20 - 10),
          speed: 0.5 + Math.random() * 0.5,
        };

        // Track spotted animal in journal
        setSave((s) =>
          s.discovered[chosenSpecies]
            ? s
            : { ...s, discovered: { ...s.discovered, [chosenSpecies]: true } }
        );

        return [...prev, newCritter];
      });
    }, 3000);

    // Critters hovering/flight movement
    const movementTimer = setInterval(() => {
      setCritters((prev) =>
        prev.map((c) => {
          const dx = c.targetX - c.x;
          const dy = c.targetY - c.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 2) {
            // Pick a new target nearby
            return {
              ...c,
              targetX: c.x + (Math.random() * 20 - 10),
              targetY: Math.max(20, Math.min(85, c.y + (Math.random() * 20 - 10))),
            };
          }

          return {
            ...c,
            x: c.x + (dx / dist) * c.speed,
            y: c.y + (dy / dist) * c.speed,
          };
        })
      );
    }, 50);

    return () => {
      clearInterval(spawnTimer);
      clearInterval(movementTimer);
    };
  }, [save.plants]);

  // Spacebar operations handler
  const performTap = useCallback(() => {
    const plotIdx = cursorIdx;
    const x = plotIdx % COLS;
    const y = Math.floor(plotIdx / COLS);
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

      const newPlant: Plant = {
        id: generateUid(),
        x,
        y,
        kind: flowerSel,
        stage: 0,
        water: 50,
        plantedAt: Date.now(),
        lastGrow: Date.now(),
      };

      setSave((s) => ({
        ...s,
        plants: [...s.plants, newPlant],
        coins: s.coins - info.cost,
        discovered: { ...s.discovered, [flowerSel]: true },
      }));

      playChime(600, 0.15);
      pushToast(`Planted ${info.name}`);
    } else if (tool === "water") {
      if (!currentPlant) {
        pushToast("Nothing here");
        return;
      }
      setSave((s) => ({
        ...s,
        plants: s.plants.map((p) =>
          p.id === currentPlant.id ? { ...p, water: Math.min(100, p.water + 30) } : p
        ),
      }));
      playChime(500, 0.1, "sine");
    } else if (tool === "harvest") {
      if (!currentPlant || currentPlant.stage !== 3) {
        pushToast("Not ready");
        return;
      }
      const reward = FLOWER_INFO[currentPlant.kind].reward;
      setSave((s) => ({
        ...s,
        plants: s.plants.filter((p) => p.id !== currentPlant.id),
        coins: s.coins + reward,
      }));
      playChime(800, 0.2);
      pushToast(`+${reward} coins 🌸`);
    } else if (tool === "decorate") {
      if (currentPlant) {
        pushToast("Plot has plant");
        return;
      }
      const existingDecor = save.decor.find((d) => d.x === x && d.y === y);

      if (existingDecor) {
        setSave((s) => ({
          ...s,
          decor: s.decor.filter((d) => d.id !== existingDecor.id),
          coins: s.coins + Math.floor(DECOR_INFO[existingDecor.kind].cost / 2),
        }));
        pushToast(`Removed ${DECOR_INFO[existingDecor.kind].name}`);
        return;
      }

      const cost = DECOR_INFO[decorSel].cost;
      if (save.coins < cost) {
        pushToast("Need coins");
        return;
      }

      const newDecor = { id: generateUid(), kind: decorSel, x, y };
      setSave((s) => ({
        ...s,
        coins: s.coins - cost,
        decor: [...s.decor, newDecor],
      }));

      playChime(400, 0.15, "triangle");
      pushToast(`Placed ${DECOR_INFO[decorSel].name}`);
    }
  }, [cursorIdx, tool, flowerSel, decorSel, save.plants, save.decor, save.coins, pushToast, playChime]);

  const advanceCursor = useCallback(() => {
    setCursorIdx((i) => (i + 1) % TOTAL_PLOTS);
    playChime(300, 0.05, "sine", 0.02);
  }, [playChime]);

  const cycleTool = useCallback(() => {
    const toolOrder: Array<typeof tool> = ["plant", "water", "harvest", "decorate"];
    setTool((current) => {
      const next = toolOrder[(toolOrder.indexOf(current) + 1) % toolOrder.length];
      pushToast(`Tool: ${next}`);
      return next;
    });
  }, [pushToast]);

  const cycleFlower = useCallback(() => {
    setFlowerSel((current) => {
      const idx = FLOWERS.indexOf(current);
      const next = FLOWERS[(idx + 1) % FLOWERS.length];
      pushToast(`Flower: ${FLOWER_INFO[next].name}`);
      return next;
    });
  }, [pushToast]);

  const handleHoldComplete = useCallback(() => {
    if (tool === "water") {
      setSave((s) => ({
        ...s,
        plants: s.plants.map((p) => ({ ...p, water: Math.min(100, p.water + 30) })),
      }));
      pushToast("Watered all flowers 💧");
      playChime(680, 0.35, "sine");
    } else {
      setCursorIdx((i) => (i + COLS) % TOTAL_PLOTS);
      cycleFlower();
    }
  }, [tool, cycleFlower, pushToast, playChime]);

  // Keyboard Space listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();

      if (splash) {
        setSplash(false);
        return;
      }

      if (holding.current) return;
      holding.current = true;
      setHoldProgress(0);

      const start = Date.now();
      holdTimer.current = window.setInterval(() => {
        const progress = Math.min(1, (Date.now() - start) / 750);
        setHoldProgress(progress);
        if (progress >= 1 && holdTimer.current) {
          window.clearInterval(holdTimer.current);
          holdTimer.current = null;
        }
      }, 30) as unknown as number;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();

      if (!holding.current) return;
      holding.current = false;

      const wasHeld = holdProgressRef.current >= 1;
      if (holdTimer.current) {
        window.clearInterval(holdTimer.current);
        holdTimer.current = null;
      }
      setHoldProgress(0);

      if (wasHeld) {
        handleHoldComplete();
        return;
      }

      tapCount.current += 1;
      if (tapTimer.current) {
        window.clearTimeout(tapTimer.current);
      }

      tapTimer.current = window.setTimeout(() => {
        const count = tapCount.current;
        tapCount.current = 0;

        if (count === 1) {
          performTap();
          advanceCursor();
        } else if (count === 2) {
          cycleTool();
        } else if (count >= 3) {
          setMenuOpen((prev) => !prev);
        }
      }, 260) as unknown as number;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [splash, performTap, advanceCursor, cycleTool, handleHoldComplete]);

  // Sky backdrop colors
  const skyBackground = useMemo(() => {
    const time = save.timeOfDay;
    const weather = save.weather;

    const gradients = {
      night: ["#0a081d", "#1e1a42", "#13132e"],
      dawn: ["#fbc2eb", "#a6c1ee", "#fffbeb"],
      day: ["#bae6fd", "#e0f2fe", "#fffbeb"],
      dusk: ["#f59e0b", "#ec4899", "#581c87"],
    };

    let p: string[];
    if (time < 0.18 || time > 0.88) p = gradients.night;
    else if (time < 0.3) p = gradients.dawn;
    else if (time < 0.7) p = gradients.day;
    else p = gradients.dusk;

    if (weather === "rain") {
      p = ["#2d3748", "#4a5568", "#1a202c"];
    }

    return `linear-gradient(180deg, ${p[0]} 0%, ${p[1]} 50%, ${p[2]} 100%)`;
  }, [save.timeOfDay, save.weather]);

  const isNight = save.timeOfDay < 0.18 || save.timeOfDay > 0.88;

  const timeLabel = useMemo(() => {
    const hours = Math.floor((save.timeOfDay * 24 + 6) % 24);
    return `${hours.toString().padStart(2, "0")}:00`;
  }, [save.timeOfDay]);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden font-(--font-body)"
      style={{ background: skyBackground, transition: "background 2s linear" }}
    >
      <Celestial timeOfDay={save.timeOfDay} />

      {isNight && <Stars />}

      <Hills />

      <WeatherFX weather={save.weather} />

      {/* Ground Garden Grid */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-b from-[#86efac] to-[#16a34a] transition-all"
        style={{ filter: isNight ? "brightness(0.65) saturate(0.8)" : "none" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="grid gap-2 sm:gap-3 p-4"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: TOTAL_PLOTS }).map((_, idx) => {
              const x = idx % COLS;
              const y = Math.floor(idx / COLS);
              const plant = save.plants.find((p) => p.x === x && p.y === y);
              const decor = save.decor.find((d) => d.x === x && d.y === y);
              const isCursor = idx === cursorIdx;

              return (
                <motion.div
                  key={idx}
                  className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-xl flex items-end justify-center"
                  style={{
                    background: isCursor
                      ? "radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 70%, transparent 100%)"
                      : "rgba(0,0,0,0.06)",
                    boxShadow: isCursor
                      ? "0 0 0 3px rgba(255,255,255,0.9), 0 0 20px rgba(255,255,255,0.4)"
                      : "inset 0 -3px 6px rgba(0,0,0,0.1)",
                  }}
                  animate={isCursor ? { y: [-1.5, 1.5, -1.5] } : { y: 0 }}
                  transition={isCursor ? { duration: 1.5, repeat: Infinity } : {}}
                >
                  {plant && (
                    <motion.div
                      key={plant.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-end justify-center"
                    >
                      <FlowerSVG kind={plant.kind} stage={plant.stage} size={64} />
                      {plant.water < 20 && <span className="absolute top-0 right-0 text-xs">🥀</span>}
                    </motion.div>
                  )}
                  {decor && !plant && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-end justify-center pb-1"
                    >
                      <DecorSVG kind={decor.kind} size={48} />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Critters Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {critters.map((c) => (
          <motion.div
            key={c.id}
            className="absolute text-3xl select-none"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span>{CRITTER_INFO[c.kind].emoji}</span>
          </motion.div>
        ))}
      </div>

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-3 pointer-events-none">
        <div className="glass-panel rounded-2xl px-4 py-3 pointer-events-auto">
          <div className="text-xs uppercase tracking-wider opacity-70">OneKey Garden</div>
          <div className="font-semibold flex items-center gap-3 text-base">
            <span>🌼 Day {save.day}</span>
            <span className="opacity-70">·</span>
            <span>{timeLabel}</span>
            <span className="opacity-70">·</span>
            <span className="capitalize">{save.weather === "rain" ? "🌧️ Rain" : "☀️ Clear"}</span>
          </div>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-3 pointer-events-auto">
          <span className="font-bold text-lg">🪙 {save.coins}</span>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end gap-3 pointer-events-none">
        <div className="glass-panel rounded-2xl px-5 py-4 pointer-events-auto flex items-center gap-4 max-w-[70%]">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-white/80 to-white/40 flex items-center justify-center text-2xl shadow-inner">
            {tool === "plant" ? "🌱" : tool === "water" ? "💧" : tool === "harvest" ? "✂️" : "🏮"}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-60">Tool</div>
            <div className="font-semibold capitalize text-lg">{tool}</div>
            {tool === "plant" && (
              <div className="text-xs opacity-80 mt-0.5">
                {FLOWER_INFO[flowerSel].emoji} {FLOWER_INFO[flowerSel].name} · 🪙 {FLOWER_INFO[flowerSel].cost}
                <span className="opacity-60"> · hold SPACE to switch</span>
              </div>
            )}
            {tool === "decorate" && (
              <div className="text-xs opacity-80 mt-0.5">
                {DECOR_INFO[decorSel].emoji} {DECOR_INFO[decorSel].name} · 🪙 {DECOR_INFO[decorSel].cost}
              </div>
            )}
            {tool === "water" && <div className="text-xs opacity-80 mt-0.5">Hold SPACE to water all</div>}
            {tool === "harvest" && <div className="text-xs opacity-80 mt-0.5">Click to harvest ready flowers</div>}
          </div>
        </div>

        <div className="glass-panel rounded-2xl px-4 py-3 pointer-events-auto text-xs space-y-1 max-w-xs">
          <div className="font-semibold text-sm mb-1">🎹 Controls</div>
          <div className="flex justify-between gap-3 text-xs">
            <span className="font-semibold opacity-80">Tap</span>
            <span className="opacity-70">use tool & move</span>
          </div>
          <div className="flex justify-between gap-3 text-xs">
            <span className="font-semibold opacity-80">Double-tap</span>
            <span className="opacity-70">switch tool</span>
          </div>
          <div className="flex justify-between gap-3 text-xs">
            <span className="font-semibold opacity-80">Hold</span>
            <span className="opacity-70">{tool === "water" ? "water all" : "next flower"}</span>
          </div>
          <div className="flex justify-between gap-3 text-xs">
            <span className="font-semibold opacity-80">Triple-tap</span>
            <span className="opacity-70">open journal</span>
          </div>
        </div>
      </div>

      {/* Charge indicator */}
      <AnimatePresence>
        {holdProgress > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-32 glass-panel rounded-full px-5 py-2"
          >
            <div className="text-xs mb-1 text-center font-medium">Charging…</div>
            <div className="w-32 h-1.5 rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-pink-400 to-purple-500"
                style={{ width: `${holdProgress * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel rounded-full px-4 py-1.5 text-sm font-medium"
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Journal Modal */}
      <AnimatePresence>
        {menuOpen && <GardenJournal save={save} onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>

      {/* Splash screen */}
      <AnimatePresence>
        {splash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-linear-to-br from-pink-100 via-purple-100 to-sky-100"
          >
            <div className="text-center max-w-md px-6">
              <h1 className="text-4xl font-bold mb-2 bg-linear-to-br from-pink-600 to-purple-600 bg-clip-text text-transparent">
                OneKey Garden
              </h1>
              <p className="opacity-80 mb-6 text-sm">A cozy spacebar gardening hackathon project.</p>
              <div className="glass-panel rounded-2xl p-4 text-xs text-left mx-auto inline-block space-y-1">
                <div className="font-semibold mb-1">🎹 spacebar only controls:</div>
                <div className="flex justify-between gap-4">
                  <span className="font-semibold">Tap</span>
                  <span>plant / water / harvest</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-semibold">Double-tap</span>
                  <span>cycle tool</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-semibold">Hold</span>
                  <span>water all / next flower</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-semibold">Triple-tap</span>
                  <span>view journal collection</span>
                </div>
              </div>
              <br />
              <motion.button
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                onClick={() => setSplash(false)}
                className="mt-6 rounded-full bg-linear-to-r from-pink-500 to-purple-500 text-white font-bold px-6 py-2.5 shadow-md cursor-pointer"
              >
                Press SPACE to Start
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isNight && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,30,0.4)_100%)]" />
      )}
    </div>
  );
}
