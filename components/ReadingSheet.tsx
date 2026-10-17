"use client";

import { useRef, useState, type PointerEvent } from "react";
import { CloseIcon } from "@/components/icons";
import { IconButton } from "@/components/ScreenLayout";
import { auraSummary, type Aura } from "@/lib/aura/generate";
import { stoneLabel } from "@/lib/aura/stones";

interface ReadingSheetProps {
  open: boolean;
  aura: Aura;
  onClose: () => void;
}

const DISMISS_DISTANCE = 90;

export function ReadingSheet({ open, aura, onClose }: ReadingSheetProps) {
  const [drag, setDrag] = useState<number | null>(null);
  const startY = useRef(0);
  const stones = aura.blobs.map((blob) => blob.stone);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    startY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag(0);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag !== null) setDrag(Math.max(0, event.clientY - startY.current));
  };
  const onPointerUp = () => {
    if ((drag ?? 0) > DISMISS_DISTANCE) onClose();
    setDrag(null);
  };

  return (
    <div className={`absolute inset-0 z-30 ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/55 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Your aura reading"
        className={`absolute inset-x-0 bottom-0 flex max-h-[82%] flex-col overflow-hidden rounded-t-[30px] border-t border-white/10 bg-[linear-gradient(160deg,rgba(14,20,62,0.94),rgba(30,14,48,0.94)_55%,rgba(46,12,34,0.96))] backdrop-blur-xl ${
          drag === null ? "transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]" : ""
        }`}
        style={{ transform: open ? `translateY(${drag ?? 0}px)` : "translateY(100%)" }}
      >
        <div
          className="shrink-0 cursor-grab touch-none px-7 pb-4 pt-3 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-white/25" />
          <div className="mt-5 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-light italic tracking-[0.3em] text-white/55">YOUR AURA READING</p>
              <h2 className="mt-2 text-[15px] font-normal italic tracking-[0.2em]">{stoneLabel(stones)}</h2>
            </div>
            <IconButton label="Close reading" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
              <CloseIcon size={18} />
            </IconButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 pb-[calc(var(--safe-bottom)+28px)]">
          <p className="text-[13px] font-light leading-relaxed text-white/80">{auraSummary(aura)}</p>

          <ul className="mt-6 space-y-6">
            {stones.map((stone) => (
              <li key={stone.id} className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-4">
                  <span
                    className="size-11 shrink-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 40% 35%, ${stone.hex} 0%, ${stone.hex}cc 45%, ${stone.hex}00 72%)`,
                      boxShadow: `0 0 26px ${stone.hex}66`,
                    }}
                  />
                  <div>
                    <p className="text-[13px] italic tracking-[0.24em]">{stone.name.toUpperCase()}</p>
                    <p className="mt-1 text-[10px] font-light italic tracking-[0.22em] text-white/55">
                      {stone.colorName.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {stone.keywords.map((word) => (
                    <span
                      key={word}
                      className="rounded-full border border-white/15 px-3 py-1 text-[9px] italic tracking-[0.2em] text-white/75"
                    >
                      {word.toUpperCase()}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-[13px] font-light leading-relaxed text-white/70">{stone.reading}</p>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-[9px] font-light italic tracking-[0.2em] text-white/35">
            FOR ENTERTAINMENT AND SELF-REFLECTION
          </p>
        </div>
      </section>
    </div>
  );
}
