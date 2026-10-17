# AuraEye

A clickable, mobile-first prototype of an aura camera. The user takes a selfie, watches a short "reading" animation, and gets an aura card: their photo inside a soft, saturated cloud of colour, named after crystals (for example "CITRINE & CARNELIAN").

There is no aura detection. The colours come from a seed hashed from the photo's pixels, so the same photo always gets the same aura. The aura is a bounded, saturated cloud shaped after the reference cards: dark above it, thinning toward the sides, dark lower corners.

The only image analysis is an on-device person cut-out (MediaPipe's selfie segmenter). It replaces the background with the cloud on black, keeps the person exactly as photographed (never darkened) under a light veil of colour, and finds the face so the aura sits lighter there. The model (about 10 MB the first time, cached afterwards) loads from the jsDelivr and Google model CDNs as soon as someone taps a start button. If it can't load, the aura is drawn over the whole photo instead.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. On a laptop the app sits inside an iPhone-style frame, and on a phone it runs full screen.

### On a real phone

Browsers only allow camera access over HTTPS, so start the dev server with a self-signed certificate:

```bash
npm run dev:phone
```

Then open `https://<your-computer's-LAN-IP>:3000` on a phone on the same Wi-Fi and accept the certificate warning. If the camera still can't be reached, the app falls back to the phone's native camera or gallery picker.

### Through a Cloudflare tunnel (any network, real HTTPS)

Run `npm run dev` (or, for a faster and steadier demo, `npm run build` then `npm start`), then in a second terminal:

```bash
cloudflared tunnel --url http://localhost:3000
```

Open the `https://….trycloudflare.com` address it prints on the phone. `*.trycloudflare.com` is already in `allowedDevOrigins` in `next.config.ts`. Any other tunnel host (ngrok and so on) must be added there, or the dev server blocks its live-reload connection and the page keeps reloading.

## Flow

| Screen | What happens |
|---|---|
| Intro | Drifting aura background, wordmark, "Take your aura photo" or "choose from gallery"; either one first asks "How many colors?" (2 or 3) |
| Camera | Front camera, a 2 / 3 colors toggle, shutter, flip, gallery. The aura covers the whole frame, so the face can be anywhere |
| Processing | About 6 s: the colour bleeds in and the cloud swirls while status lines cycle |
| Result | The aura freezes, then the wordmark, stone names, date, READING and SHARE fade in |
| Reading | Bottom sheet with a fixed reading for each stone (swipe down or tap outside to close) |

SHARE only shows a "coming soon" toast for now.

## Where things live

- `lib/aura/shader.ts`: the WebGL fragment shader that draws the whole effect. Tune the look here: cloud edge and lobes, colour borders and saturation, how much colour veils the person and their face.
- `lib/aura/renderer.ts`: the minimal WebGL setup, the person mask texture, and where the cloud sits in the frame (`PORTRAIT_LOOK`: centre and radii).
- `lib/segment.ts`: the person cut-out: loads the model, feathers the mask, and estimates where the face is.
- `lib/aura/stones.ts`: the stone palette, colours and reading copy.
- `lib/aura/generate.ts`: picks the 2 or 3 stones the user asked for (always clearly different hues) and a layout (split, diagonal, stacked or triad) from a seed, with each stone getting its own region of the frame.
- `lib/brand.ts`: the brand name and tagline.
- `components/screens/*`: the intro, camera and reveal screens. `components/PhoneFrame.tsx` and `app/globals.css` hold the desktop device frame.
