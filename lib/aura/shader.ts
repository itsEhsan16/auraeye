export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;

void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/**
 * The aura look, matched to the reference cards:
 *  1. a bounded, lumpy, saturated cloud of colour: dark band above it, thinning
 *     toward the sides, dark lower corners. Each stone owns a region inside it.
 *  2. the person exactly as photographed (never darkened) on black: the
 *     background drops away once the cut-out is ready (uMaskMix fades it in)
 *  3. the cloud laid over everything, person included, a little fainter in
 *     the middle over the face, so there is no visible cut-out edge
 * Without a cut-out the whole photo stays, under the same cloud.
 *
 * Frame coordinates: p is 0→1 with y pointing down; q rescales y so both
 * axes are in frame-width units (circles stay round on any aspect).
 */
export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uImage;
uniform float uHasImage;
uniform vec4 uCover;
uniform vec2 uResolution;
uniform float uTime;
uniform float uReveal;
uniform vec3 uColors[3];
uniform vec2 uCenters[3];
uniform float uRadii[3];
uniform float uCount;
uniform float uSeed;
uniform vec2 uCloudCenter;
uniform vec2 uCloudRadii;
uniform sampler2D uMask;
uniform float uMaskMix;
uniform vec3 uFace;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

float maxc(vec3 c) {
  return max(max(c.r, c.g), c.b);
}

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// Hue and saturation of c at luminance l ("color" blend): tints without changing brightness.
vec3 setLum(vec3 c, float l) {
  c += l - luma(c);
  float L = luma(c);
  float n = min(min(c.r, c.g), c.b);
  float x = maxc(c);
  if (n < 0.0) c = L + (c - L) * L / (L - n);
  if (x > 1.0) c = L + (c - L) * (1.0 - L) / (x - L);
  return c;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(vUv.x, 1.0 - vUv.y);
  vec2 q = vec2(p.x, p.y / aspect);
  vec2 s = vec2(fract(uSeed * 0.000123) * 97.0, fract(uSeed * 0.000371) * 61.0);
  float t = uTime;

  // Domain warp: the slow, billowing motion.
  vec2 warp = vec2(
    fbm(q * 1.6 + s + vec2(0.0, t * 0.05)),
    fbm(q * 1.6 + s + vec2(5.2, 1.3) + vec2(t * 0.04, 0.0))
  );
  vec2 qw = q + (warp - 0.5) * 0.3;

  // Colour field: every stone owns its own region, with soft but distinct borders.
  // A second, slower warp swirls the borders between colours so they read as smoke, not seams.
  vec2 qc = qw + (vec2(
    fbm(q * 1.1 + s * 0.7 + vec2(3.1, t * 0.03)),
    fbm(q * 1.1 + s * 0.7 + vec2(t * 0.025, 8.4))
  ) - 0.5) * 0.5;
  vec3 col = vec3(0.0);
  float wsum = 0.0;
  float vsum = 0.0;
  for (int i = 0; i < 3; i++) {
    if (float(i) >= uCount) break;
    vec2 d = qc - vec2(uCenters[i].x, uCenters[i].y / aspect);
    // Exponential (not gaussian) falloff: borders stay equally soft however far apart stones sit.
    float w = exp(-1.3 * length(d) / uRadii[i]);
    col += uColors[i] * w;
    vsum += maxc(uColors[i]) * w;
    wsum += w;
  }
  col /= max(wsum, 1e-6);
  // Keep the in-between blends as bright and saturated as the stones (no muddy middles).
  col *= (vsum / max(wsum, 1e-6)) / max(maxc(col), 1e-3);
  col = clamp(mix(vec3(luma(col)), col, 1.35), 0.0, 1.0);

  // The cloud: a bounded blob with big lumpy lobes, its lower half reaching a
  // little further. It blooms out from its centre as the colour arrives.
  float grow = mix(0.35, 1.0, smoothstep(0.0, 1.0, uReveal));
  vec2 e = (qw - vec2(uCloudCenter.x, uCloudCenter.y / aspect)) / (uCloudRadii * grow);
  if (e.y > 0.0) e.y /= 1.25;
  float edge = fbm(qw * 2.2 + s * 1.7 - vec2(t * 0.03, t * 0.02));
  float cloud = 1.0 - smoothstep(0.6, 1.05, length(e) + (edge - 0.5) * 0.5);
  float puff = 0.85 + 0.25 * smoothstep(0.2, 0.8, fbm(qw * 2.0 + s + vec2(t * 0.02, -t * 0.03)));

  // Reveal: colour arrives in drifting patches.
  float n = fbm(q * 2.2 + s * 1.3);
  float rv = smoothstep(n * 0.6, n * 0.6 + 0.4, uReveal);
  // The cloud's colour and density: deep and saturated, up to about full brightness.
  vec3 aura = col * cloud * puff;

  if (uHasImage < 0.5) {
    gl_FragColor = vec4(clamp(aura * rv * 0.9 + (hash(gl_FragCoord.xy + fract(t * 7.0) * 113.0) - 0.5) * 0.03, 0.0, 1.0), 1.0);
    return;
  }

  // The uploaded photo exactly as it is: its own colours and brightness.
  vec2 uvImg = vUv * uCover.xy + uCover.zw;
  vec3 photo = texture2D(uImage, uvImg).rgb;

  // The person on black: the room drops away as the colour arrives (once the cut-out
  // is ready; without one the whole photo counts as the person). The mask arrives
  // already softened (lib/segment.ts), so it is used as is.
  float m = texture2D(uMask, uvImg).r;
  float person = mix(1.0, m, uMaskMix);
  vec3 base = photo * mix(1.0, person, rv);

  // The cloud lies over everything, person included, so no cut-out edge shows. It is
  // a little fainter in the middle, over the face (uFace: centre, then radius in
  // frame-width units). This fade follows position only, never the outline.
  float fd = length((q - vec2(uFace.x, uFace.y / aspect)) / vec2(1.0, 1.25)) / uFace.z;
  float middle = 1.0 - 0.65 * (1.0 - smoothstep(0.24, 1.0, fd));
  vec3 layer = aura * 0.95 * middle * rv;

  // A light tint where the cloud covers the person (it keeps their brightness), then the
  // cloud's light screen-blended on top: screen only ever brightens, so nothing darkens.
  vec3 tinted = mix(base, setLum(col, luma(base)), cloud * middle * rv * 0.35);
  vec3 color = 1.0 - (1.0 - tinted) * (1.0 - layer);

  color += (hash(gl_FragCoord.xy + fract(t * 7.0) * 113.0) - 0.5) * 0.03;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
