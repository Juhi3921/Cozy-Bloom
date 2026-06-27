export type Weather = "clear" | "rain";

export type FlowerKind = "daisy" | "tulip" | "sunflower" | "lavender" | "glowbloom";

export type CritterKind = "butterfly" | "bee" | "bird";

export type DecorKind = "bench" | "pond" | "lantern";

export type Stage = 0 | 1 | 2 | 3; // 0 = seed, 1 = sprout, 2 = bud, 3 = bloom

export interface Plant {
  id: string;
  x: number;
  y: number;
  kind: FlowerKind;
  stage: Stage;
  water: number; // 0-100
  plantedAt: number;
  lastGrow: number;
}

export interface Critter {
  id: string;
  kind: CritterKind;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
}

export interface Decor {
  id: string;
  kind: DecorKind;
  x: number;
  y: number;
}

export interface Save {
  plants: Plant[];
  decor: Decor[];
  coins: number;
  day: number;
  timeOfDay: number; // 0 to 1
  weather: Weather;
  discovered: Record<string, true>;
}

export const SAVE_KEY = "onekey-garden-save-v1";
export const FLOWERS: FlowerKind[] = ["daisy", "tulip", "sunflower", "lavender", "glowbloom"];

export interface FlowerDetails {
  name: string;
  emoji: string;
  colors: [string, string];
  petals: number;
  magical?: boolean;
  cost: number;
  reward: number;
}

export const FLOWER_INFO: Record<FlowerKind, FlowerDetails> = {
  daisy: { name: "Daisy", emoji: "🌼", colors: ["#fef9c3", "#facc15"], petals: 8, cost: 3, reward: 7 },
  tulip: { name: "Tulip", emoji: "🌷", colors: ["#fbcfe8", "#ec4899"], petals: 5, cost: 5, reward: 11 },
  sunflower: { name: "Sunflower", emoji: "🌻", colors: ["#fde68a", "#d97706"], petals: 12, cost: 8, reward: 18 },
  lavender: { name: "Lavender", emoji: "💜", colors: ["#ddd6fe", "#7c3aed"], petals: 6, cost: 12, reward: 27 },
  glowbloom: {
    name: "Glowbloom",
    emoji: "✨",
    colors: ["#a7f3d0", "#10b981"],
    petals: 8,
    magical: true,
    cost: 20,
    reward: 50,
  },
};

export interface DecorDetails {
  name: string;
  emoji: string;
  cost: number;
}

export const DECOR_INFO: Record<DecorKind, DecorDetails> = {
  bench: { name: "Bench", emoji: "🪑", cost: 15 },
  pond: { name: "Pond", emoji: "🪷", cost: 30 },
  lantern: { name: "Lantern", emoji: "🏮", cost: 20 },
};

export interface CritterDetails {
  name: string;
  emoji: string;
}

export const CRITTER_INFO: Record<CritterKind, CritterDetails> = {
  butterfly: { name: "Butterfly", emoji: "🦋" },
  bee: { name: "Bee", emoji: "🐝" },
  bird: { name: "Bird", emoji: "🐦" },
};

export const generateUid = () => Math.random().toString(36).slice(2, 10);

export const createDefaultSave = (): Save => ({
  plants: [],
  decor: [],
  coins: 50,
  day: 1,
  timeOfDay: 0.3,
  weather: "clear",
  discovered: {},
});

export function loadGameSave(): Save {
  if (typeof window === "undefined") return createDefaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultSave();
    return { ...createDefaultSave(), ...JSON.parse(raw) };
  } catch {
    return createDefaultSave();
  }
}
