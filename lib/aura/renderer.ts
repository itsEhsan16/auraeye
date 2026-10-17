import type { Aura, FramePoint } from "./generate";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";
import { hexToRgb } from "./stones";

/** Where the aura cloud sits in the frame. */
export interface AuraLook {
  /** Cloud centre, frame coordinates (y down). */
  cloudCenter: FramePoint;
  /** Cloud radii in frame-width units (the lower half stretches a little further, see the shader). */
  cloudRadii: [number, number];
}

/**
 * The aura card cloud, measured off the reference cards: a dark band above it,
 * thinning toward the sides, dark lower corners, the face in its lower middle.
 */
export const PORTRAIT_LOOK: AuraLook = { cloudCenter: [0.5, 0.47], cloudRadii: [0.6, 0.62] };

const UNIFORMS = [
  "uImage",
  "uHasImage",
  "uCover",
  "uResolution",
  "uTime",
  "uReveal",
  "uColors",
  "uCenters",
  "uRadii",
  "uCount",
  "uSeed",
  "uCloudCenter",
  "uCloudRadii",
] as const;

type UniformName = (typeof UNIFORMS)[number];

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Aura shader failed to compile: ${log}`);
  }
  return shader;
}

/** Draws the aura into a canvas with one full-screen WebGL pass. */
export class AuraRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private loc = {} as Record<UniformName, WebGLUniformLocation | null>;
  private image: TexImageSource | null = null;
  private imageSize: [number, number] = [1, 1];
  private aura: Aura | null = null;
  private look: AuraLook = PORTRAIT_LOOK;
  private lost = false;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      // Keeps the last frame readable (drawImage/toBlob), e.g. for saving or sharing the card.
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL is not available");
    this.gl = gl;
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    this.init();
  }

  private onLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
  };

  private onRestored = () => {
    this.lost = false;
    this.init();
    if (this.image) this.uploadImage();
  };

  private init() {
    const { gl } = this;
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Aura program failed to link: ${gl.getProgramInfoLog(program)}`);
    }
    this.program = program;
    gl.useProgram(program);

    // One triangle that covers the whole viewport.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    for (const name of UNIFORMS) this.loc[name] = gl.getUniformLocation(program, name);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // A 1×1 placeholder until a photo arrives (the intro has none), so the texture is always complete.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(3));
    gl.uniform1i(this.loc.uImage, 0);
  }

  setImage(image: HTMLCanvasElement | null) {
    this.image = image;
    if (image) {
      this.imageSize = [image.width, image.height];
      this.uploadImage();
    }
  }

  private uploadImage() {
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.image!);
  }

  setAura(aura: Aura, look: AuraLook = PORTRAIT_LOOK) {
    this.aura = aura;
    this.look = look;
  }

  /** Matches the drawing buffer to the canvas' CSS size. */
  resize(maxDpr = 2) {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  render(time: number, reveal: number) {
    const { gl, aura, loc } = this;
    if (this.lost || !this.program || !aura) return;
    const { width, height } = this.canvas;
    gl.viewport(0, 0, width, height);

    // object-fit: cover, in texture space.
    const canvasAspect = width / height;
    const imageAspect = this.imageSize[0] / this.imageSize[1];
    const sx = imageAspect > canvasAspect ? canvasAspect / imageAspect : 1;
    const sy = imageAspect > canvasAspect ? 1 : imageAspect / canvasAspect;
    gl.uniform4f(loc.uCover, sx, sy, (1 - sx) / 2, (1 - sy) / 2);

    const colors = new Float32Array(9);
    const centers = new Float32Array(6);
    const radii = new Float32Array(3);
    aura.blobs.slice(0, 3).forEach((blob, i) => {
      colors.set(hexToRgb(blob.stone.hex), i * 3);
      centers.set(blob.center, i * 2);
      radii[i] = blob.radius;
    });

    gl.uniform1f(loc.uHasImage, this.image ? 1 : 0);
    gl.uniform2f(loc.uResolution, width, height);
    gl.uniform1f(loc.uTime, time);
    gl.uniform1f(loc.uReveal, reveal);
    gl.uniform3fv(loc.uColors, colors);
    gl.uniform2fv(loc.uCenters, centers);
    gl.uniform1fv(loc.uRadii, radii);
    gl.uniform1f(loc.uCount, Math.min(aura.blobs.length, 3));
    gl.uniform1f(loc.uSeed, aura.seed % 100000);
    gl.uniform2f(loc.uCloudCenter, ...this.look.cloudCenter);
    gl.uniform2f(loc.uCloudRadii, ...this.look.cloudRadii);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    if (this.texture) this.gl.deleteTexture(this.texture);
    if (this.program) this.gl.deleteProgram(this.program);
  }
}
