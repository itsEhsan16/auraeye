"use client";

import { ArchedWordmark } from "@/components/ArchedWordmark";
import { AuraCanvas } from "@/components/AuraCanvas";
import { INTRO_AURA } from "@/lib/aura/generate";
import type { AuraLook } from "@/lib/aura/renderer";
import { TAGLINE } from "@/lib/brand";

const INTRO_LOOK: AuraLook = { cloudCenter: [0.5, 0.42], cloudRadii: [0.85, 0.85] };

interface IntroScreenProps {
  onStart: () => void;
  onPickPhoto: () => void;
}

export function IntroScreen({ onStart, onPickPhoto }: IntroScreenProps) {
  return (
    <div className="absolute inset-0 animate-fade-in">
      <AuraCanvas
        photo={null}
        aura={INTRO_AURA}
        look={INTRO_LOOK}
        mode="live"
        revealDuration={2.5}
        className="absolute inset-0"
      />
      <div className="absolute inset-0 flex flex-col items-center px-8 pb-[calc(var(--safe-bottom)+40px)] pt-[var(--safe-top)]">
        <div className="flex flex-1 flex-col items-center justify-center">
          <ArchedWordmark width={250} className="animate-rise-in text-white" />
          <p
            className="mt-3 animate-rise-in text-[10px] font-light italic tracking-[0.34em] text-white/80"
            style={{ animationDelay: "250ms" }}
          >
            {TAGLINE}
          </p>
        </div>

        <div
          className="flex w-full animate-rise-in flex-col items-center"
          style={{ animationDelay: "500ms" }}
        >
          <button
            type="button"
            onClick={onStart}
            className="h-14 w-full max-w-[290px] rounded-full border border-white/50 bg-white/[0.06] text-[11px] italic tracking-[0.28em] text-white backdrop-blur-md transition hover:bg-white/10 active:scale-[0.98]"
          >
            TAKE YOUR AURA PHOTO
          </button>
          <button
            type="button"
            onClick={onPickPhoto}
            className="mt-5 text-[10px] font-light italic tracking-[0.26em] text-white/60 transition hover:text-white/90"
          >
            OR CHOOSE FROM GALLERY
          </button>
        </div>
      </div>
    </div>
  );
}
