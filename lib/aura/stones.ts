export type StoneId =
  | "garnet"
  | "carnelian"
  | "citrine"
  | "emerald"
  | "turquoise"
  | "sapphire"
  | "amethyst"
  | "quartz";

export interface Stone {
  id: StoneId;
  name: string;
  colorName: string;
  /** Display colour, also fed to the shader. */
  hex: string;
  /** Relative likelihood of being picked. */
  weight: number;
  keywords: string[];
  reading: string;
}

export const STONES: Stone[] = [
  {
    id: "garnet",
    name: "Garnet",
    colorName: "Red",
    hex: "#E5221C",
    weight: 1,
    keywords: ["Grounded", "Passionate", "Driven"],
    reading:
      "Red energy runs close to the body. You are rooted, physical and quick to act, with a steady fire that pulls people toward you. Lately your drive is high, so give it a clear direction.",
  },
  {
    id: "carnelian",
    name: "Carnelian",
    colorName: "Orange",
    hex: "#FF6E14",
    weight: 1,
    keywords: ["Creative", "Bold", "Social"],
    reading:
      "Orange carries warmth and creative courage. You light up in good company and turn ideas into something real. This is a good moment to start the project you keep circling.",
  },
  {
    id: "citrine",
    name: "Citrine",
    colorName: "Yellow",
    hex: "#FFC81E",
    weight: 1,
    keywords: ["Optimistic", "Curious", "Bright"],
    reading:
      "Yellow is the colour of a busy, sunlit mind. You are curious, playful and quick to find the upside. Your confidence is contagious right now, so share it.",
  },
  {
    id: "emerald",
    name: "Emerald",
    colorName: "Green",
    hex: "#16B04A",
    weight: 1,
    keywords: ["Healing", "Growing", "Heart-led"],
    reading:
      "Green shows a heart in growth mode. You give care easily and you are building something slowly and well. Remember to turn some of that nurturing toward yourself.",
  },
  {
    id: "turquoise",
    name: "Turquoise",
    colorName: "Teal",
    hex: "#13C7C0",
    weight: 0.8,
    keywords: ["Calm", "Expressive", "Empathic"],
    reading:
      "Teal blends calm with clear expression. People feel safe talking to you, and you know how to say hard things kindly. Your words carry extra weight at the moment.",
  },
  {
    id: "sapphire",
    name: "Sapphire",
    colorName: "Blue",
    hex: "#2B5BFF",
    weight: 0.9,
    keywords: ["Intuitive", "Honest", "Peaceful"],
    reading:
      "Blue is quiet depth. You read a room before you speak, and you value truth over noise. Trust the gut feeling you have been second-guessing.",
  },
  {
    id: "amethyst",
    name: "Amethyst",
    colorName: "Violet",
    hex: "#8A3BFF",
    weight: 0.9,
    keywords: ["Visionary", "Spiritual", "Dreamy"],
    reading:
      "Violet points to imagination and inner vision. You see patterns other people miss and you dream in big pictures. Write the ideas down; some of them are bigger than they look.",
  },
  {
    id: "quartz",
    name: "Quartz",
    colorName: "Pink",
    hex: "#FF3C9A",
    weight: 1,
    keywords: ["Loving", "Gentle", "Open"],
    reading:
      "Pink is soft, open-hearted energy. You lead with kindness and notice how other people feel. Your relationships are in focus now, so let yourself receive as much as you give.",
  },
];

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Hue in degrees. Every stone is a saturated colour, so this is always defined. */
function hue(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** Degrees apart on the colour wheel. */
export function hueDistance(a: Stone, b: Stone): number {
  const d = Math.abs(hue(a.hex) - hue(b.hex));
  return Math.min(d, 360 - d);
}

/** "CITRINE & CARNELIAN", "QUARTZ CITRINE & EMERALD" — as on the reference cards. */
export function stoneLabel(stones: Stone[]): string {
  const names = stones.map((s) => s.name.toUpperCase());
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(" ")} & ${names[names.length - 1]}`;
}
