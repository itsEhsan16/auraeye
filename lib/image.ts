/** Width / height of the aura photo frame. */
export const PHOTO_ASPECT = 4 / 5;
const MAX_WIDTH = 1080;

/** Center-crops a source to the photo aspect, like CSS object-fit: cover. */
function cropToPhoto(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  mirror: boolean,
): HTMLCanvasElement {
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (sw / sh > PHOTO_ASPECT) sw = sh * PHOTO_ASPECT;
  else sh = sw / PHOTO_ASPECT;
  const sx = (sourceWidth - sw) / 2;
  const sy = (sourceHeight - sh) / 2;

  const width = Math.round(Math.min(MAX_WIDTH, sw));
  const height = Math.round(width / PHOTO_ASPECT);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  return canvas;
}

export function captureVideoFrame(video: HTMLVideoElement, mirror: boolean) {
  return cropToPhoto(video, video.videoWidth, video.videoHeight, mirror);
}

export async function loadPhotoFile(file: File): Promise<HTMLCanvasElement> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const canvas = cropToPhoto(bitmap, bitmap.width, bitmap.height, false);
      bitmap.close();
      return canvas;
    } catch {
      // Some browsers reject the options bag or the format; fall through.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return cropToPhoto(img, img.naturalWidth, img.naturalHeight, false);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** A stable number derived from the photo's pixels (FNV-1a over a 16×16 thumbnail). */
export function photoSeed(photo: HTMLCanvasElement): number {
  const size = 16;
  const thumb = document.createElement("canvas");
  thumb.width = size;
  thumb.height = size;
  const ctx = thumb.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(photo, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      hash ^= data[i + c] >> 3;
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return hash >>> 0;
}
