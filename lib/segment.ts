import type { ImageSegmenter } from "@mediapipe/tasks-vision";

// Keep the version in step with @mediapipe/tasks-vision in package.json.
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

/** The stored mask is small: plenty for a soft cut-out, and cheap to filter. */
const MASK_W = 160;
const MASK_H = 200;
/** Photo frame width / height (4:5), to turn widths into heights. */
const ASPECT = MASK_W / MASK_H;
/**
 * How far the outline is pulled in (mask pixels, ~2.5% of the width). The model's
 * cut-out tends to reach a little past the hair onto the wall; pulling in drops that
 * sliver of room, which otherwise shows as a pale band between the hair and the cloud.
 */
const SHRINK = 4;
/** Feather: three box-blur passes (close to a gaussian) of this radius soften the edge. */
const FEATHER = 3;
const FEATHER_PASSES = 3;

export interface PersonCutout {
  /** Grayscale, same framing as the photo: white = person, black = background, with a soft, wide edge. */
  mask: HTMLCanvasElement;
  /** The face: centre (frame coordinates, y down) and a radius in frame-width units. */
  face: [number, number, number];
}

let segmenter: Promise<ImageSegmenter> | null = null;

/**
 * MediaPipe prints harmless "INFO: …" start-up lines through console.error, which
 * Next's dev overlay flags as an issue. Drop only those while the model starts.
 */
async function withoutInfoLogs<T>(work: () => Promise<T> | T): Promise<T> {
  const error = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("INFO:")) return;
    error(...args);
  };
  try {
    return await work();
  } finally {
    console.error = error;
  }
}

/**
 * Loads the on-device person segmentation model. The first load fetches about
 * 10 MB, so call this early (before the photo) to have it ready at capture.
 */
export function preloadSegmenter(): Promise<ImageSegmenter> {
  segmenter ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    return withoutInfoLogs(() =>
      ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        runningMode: "IMAGE",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      }),
    );
  })().catch((error) => {
    segmenter = null; // let a later photo retry
    throw error;
  });
  return segmenter;
}

/**
 * Separates the person from the background, so the background can become the
 * aura cloud. Resolves to null if the model can't load or finds nobody; the
 * aura then covers the whole photo instead.
 */
export async function cutOutPerson(photo: HTMLCanvasElement): Promise<PersonCutout | null> {
  try {
    const model = await preloadSegmenter();
    const result = await withoutInfoLogs(() => model.segment(photo));
    const masks = result.confidenceMasks ?? [];
    // One mask (person) for the selfie model; if a model ever adds a background mask, it comes first.
    const person = masks[masks.length - 1];
    if (!person) return null;
    const small = downsample(person.getAsFloat32Array(), person.width, person.height);
    masks.forEach((mask) => mask.close());
    const face = findFace(small); // from the model's own outline, before softening
    if (!face) return null;
    soften(small);
    return { mask: toCanvas(small), face };
  } catch (error) {
    console.warn("Person cut-out unavailable; showing the aura over the whole photo.", error);
    return null;
  }
}

/** Box-averages the full-size mask down to MASK_W × MASK_H. */
function downsample(src: Float32Array, w: number, h: number): Float32Array {
  const out = new Float32Array(MASK_W * MASK_H);
  for (let y = 0; y < MASK_H; y++) {
    const y0 = Math.floor((y * h) / MASK_H);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * h) / MASK_H));
    for (let x = 0; x < MASK_W; x++) {
      const x0 = Math.floor((x * w) / MASK_W);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * w) / MASK_W));
      let sum = 0;
      for (let sy = y0; sy < y1; sy++) for (let sx = x0; sx < x1; sx++) sum += src[sy * w + sx];
      out[y * MASK_W + x] = sum / ((y1 - y0) * (x1 - x0));
    }
  }
  return out;
}

/**
 * Turns the model's raw confidence into a soft cut-out, in place: clean it to a firm
 * shape (dropping faint specks in the background), pull the outline in, then
 * feather it wide so the person fades into the cloud instead of ending at a line.
 */
function soften(m: Float32Array) {
  for (let i = 0; i < m.length; i++) {
    const t = Math.min(1, Math.max(0, (m[i] - 0.3) / 0.4));
    m[i] = t * t * (3 - 2 * t);
  }
  filter(m, SHRINK, "min");
  for (let i = 0; i < FEATHER_PASSES; i++) filter(m, FEATHER, "mean");
}

/**
 * One separable filter (rows, then columns) over 2·radius+1 neighbours, in place:
 * "mean" is a box blur, "min" pulls bright areas in. Pixels past the frame edge are
 * skipped, so a person running off the edge of the photo is not eaten into there.
 */
function filter(m: Float32Array, radius: number, kind: "mean" | "min") {
  const tmp = new Float32Array(m.length);
  const pass = (from: Float32Array, to: Float32Array, horizontal: boolean) => {
    for (let y = 0; y < MASK_H; y++) {
      for (let x = 0; x < MASK_W; x++) {
        let sum = 0;
        let n = 0;
        let min = 1;
        for (let k = -radius; k <= radius; k++) {
          const sx = horizontal ? x + k : x;
          const sy = horizontal ? y : y + k;
          if (sx < 0 || sy < 0 || sx >= MASK_W || sy >= MASK_H) continue;
          const v = from[sy * MASK_W + sx];
          sum += v;
          n++;
          if (v < min) min = v;
        }
        to[y * MASK_W + x] = kind === "mean" ? sum / n : min;
      }
    }
  };
  pass(m, tmp, true);
  pass(tmp, m, false);
}

/**
 * Estimates where the face is from the outline: the head's centre and width
 * come from the band just below the top of the head, and the face sits a bit
 * more than half a head-width below that top.
 */
function findFace(m: Float32Array): PersonCutout["face"] | null {
  const rowFill = (y: number) => {
    let sum = 0;
    for (let x = 0; x < MASK_W; x++) sum += m[y * MASK_W + x];
    return sum / MASK_W;
  };
  let top = 0;
  while (top < MASK_H && rowFill(top) < 0.04) top++;
  if (top >= MASK_H * 0.85) return null; // nobody in the shot

  const from = Math.min(MASK_H - 1, top + Math.round(MASK_H * 0.06));
  const to = Math.min(MASK_H, top + Math.round(MASK_H * 0.18));
  let width = 0;
  let weight = 0;
  let cx = 0;
  for (let y = from; y < to; y++) {
    width = Math.max(width, rowFill(y));
    for (let x = 0; x < MASK_W; x++) {
      const v = m[y * MASK_W + x];
      weight += v;
      cx += v * x;
    }
  }

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return [
    clamp(weight > 0 ? cx / weight / MASK_W : 0.5, 0.25, 0.75),
    clamp(top / MASK_H + 0.62 * width * ASPECT, 0.3, 0.7),
    clamp(width * 0.8, 0.26, 0.55),
  ];
}

function toCanvas(m: Float32Array): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = MASK_W;
  canvas.height = MASK_H;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(MASK_W, MASK_H);
  for (let i = 0; i < m.length; i++) {
    const v = Math.round(Math.min(1, Math.max(0, m[i])) * 255);
    image.data[i * 4] = image.data[i * 4 + 1] = image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
