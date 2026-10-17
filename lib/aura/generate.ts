import { hueDistance, STONES, type Stone } from "./stones";

export type AuraLayout = "split" | "diagonal" | "stacked" | "triad";

/** How many stones the reading shows; the user picks this before the photo. */
export type ColorCount = 2 | 3;

/** A point in the photo frame: x 0→1 left to right, y 0→1 top to bottom. */
export type FramePoint = [number, number];

export interface AuraBlob {
  stone: Stone;
  center: FramePoint;
  /** How far the stone's colour reaches, in frame-width units. */
  radius: number;
}

export interface Aura {
  /** In label order: left→right, or top→bottom. */
  blobs: AuraBlob[];
  layout: AuraLayout;
  seed: number;
}

/** Small, fast, deterministic PRNG. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Colours closer than this on the hue wheel read as one colour, so they are not paired. */
const MIN_HUE_GAP = 35;

function pickStones(rand: () => number, count: number): Stone[] {
  let pool = [...STONES];
  const picked: Stone[] = [];
  while (picked.length < count && pool.length) {
    const total = pool.reduce((sum, s) => sum + s.weight, 0);
    let r = rand() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) {
      r -= pool[i].weight;
      if (r <= 0) break;
    }
    const stone = pool.splice(i, 1)[0];
    picked.push(stone);
    pool = pool.filter((s) => hueDistance(s, stone) >= MIN_HUE_GAP);
  }
  return picked;
}

/**
 * Builds a believable-looking aura from a seed. No analysis happens here:
 * the seed comes from the photo's pixels, so the same photo gets the same aura.
 * Every layout gives each stone its own clear region of the frame.
 */
export function generateAura(seed: number, count: ColorCount): Aura {
  const rand = mulberry32(seed);
  const jitter = (amount: number) => (rand() - 0.5) * 2 * amount;
  const [a, b, c] = pickStones(rand, count);
  const variant = rand() < 0.5;

  if (count === 3 && variant) {
    return {
      layout: "stacked",
      seed,
      blobs: [
        { stone: a, center: [0.5 + jitter(0.15), 0.12 + jitter(0.03)], radius: 0.36 },
        { stone: b, center: [0.5 + jitter(0.1), 0.44 + jitter(0.03)], radius: 0.36 },
        { stone: c, center: [0.5 + jitter(0.25), 0.78 + jitter(0.03)], radius: 0.4 },
      ],
    };
  }

  if (count === 3) {
    return {
      layout: "triad",
      seed,
      blobs: [
        { stone: a, center: [0.1 + jitter(0.05), 0.3 + jitter(0.06)], radius: 0.42 },
        { stone: b, center: [0.9 + jitter(0.05), 0.3 + jitter(0.06)], radius: 0.42 },
        { stone: c, center: [0.5 + jitter(0.15), 0.78 + jitter(0.03)], radius: 0.4 },
      ],
    };
  }

  if (variant) {
    const flip = rand() < 0.5;
    return {
      layout: "diagonal",
      seed,
      blobs: [
        { stone: a, center: [flip ? 0.78 : 0.22, 0.16 + jitter(0.04)], radius: 0.5 },
        { stone: b, center: [flip ? 0.2 : 0.8, 0.7 + jitter(0.05)], radius: 0.5 },
      ],
    };
  }

  return {
    layout: "split",
    seed,
    blobs: [
      { stone: a, center: [0.08 + jitter(0.04), 0.4 + jitter(0.08)], radius: 0.5 },
      { stone: b, center: [0.92 + jitter(0.04), 0.44 + jitter(0.08)], radius: 0.5 },
    ],
  };
}

/** One-line overview shown at the top of the reading. */
export function auraSummary(aura: Aura): string {
  const [a, b, c] = aura.blobs.map((blob) => `${blob.stone.name} ${blob.stone.colorName.toLowerCase()}`);
  switch (aura.layout) {
    case "stacked":
      return `Your field moves from ${a} above you, through ${b} around your head, down to ${c} close to your body.`;
    case "triad":
      return `${a} on your left and ${b} on your right meet over your head, grounded by ${c} close to your body.`;
    case "diagonal":
      return `Your field flows from ${a} above you into ${b} close to your body: two energies working together.`;
    default:
      return `Your aura is split between ${a} on your left and ${b} on your right: two energies working side by side.`;
  }
}

/** The aura behind the intro screen. */
export const INTRO_AURA: Aura = {
  layout: "stacked",
  seed: 7,
  blobs: [
    { stone: STONES.find((s) => s.id === "quartz")!, center: [0.3, 0.3], radius: 0.4 },
    { stone: STONES.find((s) => s.id === "carnelian")!, center: [0.72, 0.42], radius: 0.36 },
    { stone: STONES.find((s) => s.id === "amethyst")!, center: [0.45, 0.62], radius: 0.4 },
  ],
};
