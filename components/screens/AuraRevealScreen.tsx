"use client";

import { useEffect, useRef, useState } from "react";
import { ArchedWordmark } from "@/components/ArchedWordmark";
import { AuraCanvas } from "@/components/AuraCanvas";
import { CloseIcon, ReadingIcon, RetakeIcon, ShareIcon } from "@/components/icons";
import { ReadingSheet } from "@/components/ReadingSheet";
import { BottomPanel, CircleAction, IconButton, TopBar } from "@/components/ScreenLayout";
import { Toast } from "@/components/Toast";
import type { Aura } from "@/lib/aura/generate";
import { stoneLabel } from "@/lib/aura/stones";

const PROCESS_MS = 6000;
const STATUSES = [
  "READING YOUR ENERGY",
  "MAPPING YOUR BIOFIELD",
  "BLENDING YOUR COLORS",
  "REVEALING YOUR AURA",
];

interface AuraRevealScreenProps {
  photo: HTMLCanvasElement;
  aura: Aura;
  date: string;
  onClose: () => void;
  onRetake: () => void;
}

/**
 * Processing and result share one screen so the canvas never remounts:
 * the aura bleeds in and drifts, then eases to a stop and the card details appear.
 */
export function AuraRevealScreen({ photo, aura, date, onClose, onRetake }: AuraRevealScreenProps) {
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const [readingOpen, setReadingOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const stepMs = PROCESS_MS / STATUSES.length;
    const timers = STATUSES.slice(1).map((_, i) => setTimeout(() => setStep(i + 1), (i + 1) * stepMs));
    timers.push(setTimeout(() => setDone(true), PROCESS_MS));
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message: string) => {
    clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  const reveal = (delay: number) => ({
    className: `absolute inset-0 transition-all duration-1000 ${done ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`,
    style: { transitionDelay: done ? `${delay}ms` : "0ms" },
  });

  return (
    <div className="absolute inset-0 flex animate-fade-in flex-col bg-black">
      <TopBar>
        <IconButton label="Close" onClick={onClose}>
          <CloseIcon size={22} />
        </IconButton>
        <IconButton
          label="Retake photo"
          onClick={onRetake}
          className={`transition-opacity duration-700 ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <RetakeIcon size={22} />
        </IconButton>
      </TopBar>

      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden">
        <AuraCanvas
          photo={photo}
          aura={aura}
          mode={done ? "static" : "live"}
          revealDuration={(PROCESS_MS - 600) / 1000}
        />

        {!done && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[10%] animate-scan bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        )}

        <div className="pointer-events-none absolute inset-0 text-white">
          <div {...reveal(0)}>
            <ArchedWordmark width={124} className="absolute left-1/2 top-[7%] -translate-x-1/2 opacity-95" />
          </div>
          <div {...reveal(250)}>
            <p className="absolute bottom-[5%] left-[3.5%] text-[11px] font-light italic tracking-[0.3em] [writing-mode:vertical-rl]">
              {stoneLabel(aura.blobs.map((blob) => blob.stone))}
            </p>
          </div>
          <div {...reveal(400)}>
            <p className="absolute bottom-[5.5%] right-[5%] text-[12px] font-light italic tracking-[0.12em]">
              {date}
            </p>
          </div>
        </div>
      </div>

      <BottomPanel>
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-5 transition-opacity duration-500 ${
            done ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <p key={step} className="animate-fade-in text-[10px] font-light italic tracking-[0.3em] text-white/85">
            {STATUSES[step]}…
          </p>
          <div className="h-px w-40 overflow-hidden bg-white/15">
            <div
              className="h-full origin-left bg-white/80"
              style={{ animation: `progress ${PROCESS_MS}ms linear both` }}
            />
          </div>
        </div>

        <div
          className={`flex w-full items-center justify-around px-12 transition-all duration-700 ${
            done ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          }`}
          style={{ transitionDelay: done ? "500ms" : "0ms" }}
        >
          <CircleAction label="READING" icon={<ReadingIcon size={24} />} onClick={() => setReadingOpen(true)} />
          <CircleAction label="SHARE" icon={<ShareIcon size={22} />} onClick={() => showToast("SHARING IS COMING SOON")} />
        </div>
      </BottomPanel>

      <ReadingSheet open={readingOpen} aura={aura} onClose={() => setReadingOpen(false)} />
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
