"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Aura } from "@/lib/aura/generate";
import { AuraRenderer, PORTRAIT_LOOK, type AuraLook } from "@/lib/aura/renderer";

interface AuraCanvasProps {
  photo: HTMLCanvasElement | null;
  aura: Aura;
  look?: AuraLook;
  /** "live" drifts continuously; "static" eases to a stop, then stops rendering. */
  mode: "live" | "static";
  /** Seconds for the colour to bleed in. 0 shows the finished aura at once. */
  revealDuration?: number;
  className?: string;
}

export function AuraCanvas({
  photo,
  aura,
  look = PORTRAIT_LOOK,
  mode,
  revealDuration = 0,
  className = "",
}: AuraCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const startLoop = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    let renderer: AuraRenderer;
    try {
      renderer = new AuraRenderer(canvas);
    } catch (error) {
      console.warn(error);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL support is only knowable here
      setFailed(true);
      return;
    }
    renderer.setImage(photo);
    renderer.setAura(aura, look);

    const state = {
      time: (aura.seed % 1000) / 10,
      speed: modeRef.current === "live" ? 1 : 0,
      reveal: revealDuration > 0 ? 0 : 1,
      startedAt: performance.now(),
      last: 0,
      raf: 0,
      running: false,
    };

    const frame = (now: number) => {
      const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 0;
      state.last = now;
      const live = modeRef.current === "live";
      state.speed = live ? Math.min(1, state.speed + dt * 2) : Math.max(0, state.speed - dt / 0.9);
      state.time += dt * state.speed;
      // Wall-clock based, so the colour keeps pace with the processing text even on slow frames.
      if (revealDuration > 0) {
        state.reveal = Math.min(1, (now - state.startedAt) / 1000 / revealDuration);
      }

      renderer.resize();
      renderer.render(state.time, state.reveal);

      if (!live && state.speed === 0 && state.reveal >= 1) {
        state.running = false;
        return;
      }
      state.raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (state.running) return;
      state.running = true;
      state.last = 0;
      state.raf = requestAnimationFrame(frame);
    };
    startLoop.current = start;
    start();

    const observer = new ResizeObserver(() => {
      renderer.resize();
      renderer.render(state.time, state.reveal);
    });
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(state.raf);
      observer.disconnect();
      renderer.dispose();
      startLoop.current = () => {};
    };
  }, [photo, aura, look, revealDuration]);

  useEffect(() => {
    modeRef.current = mode;
    startLoop.current();
  }, [mode]);


  if (failed) return <FallbackAura photo={photo} aura={aura} className={className} />;

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} />;
}

/** CSS-only approximation for browsers without WebGL. */
function FallbackAura({
  photo,
  aura,
  className,
}: {
  photo: HTMLCanvasElement | null;
  aura: Aura;
  className: string;
}) {
  const src = useMemo(() => photo?.toDataURL("image/jpeg", 0.85), [photo]);
  return (
    <div className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- a local data URL
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover grayscale contrast-125" />
      )}
      {aura.blobs.map((blob) => (
        <div
          key={blob.stone.id}
          className="absolute rounded-full mix-blend-screen blur-3xl"
          style={{
            left: `${blob.center[0] * 100}%`,
            top: `${blob.center[1] * 100}%`,
            width: `${blob.radius * 220}%`,
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${blob.stone.hex} 0%, transparent 70%)`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
