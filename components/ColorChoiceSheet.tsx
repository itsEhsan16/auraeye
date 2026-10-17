"use client";

import type { ColorCount } from "@/lib/aura/generate";

const OPTIONS: { count: ColorCount; title: string; note: string; orb: string }[] = [
  {
    count: 2,
    title: "TWO COLORS",
    note: "Your two strongest energies",
    orb: "radial-gradient(circle at 30% 42%, #FF3C9A 0 26%, transparent 64%), radial-gradient(circle at 70% 58%, #FF6E14 0 26%, transparent 64%)",
  },
  {
    count: 3,
    title: "THREE COLORS",
    note: "A fuller, layered reading",
    orb: "radial-gradient(circle at 50% 26%, #8A3BFF 0 20%, transparent 56%), radial-gradient(circle at 28% 66%, #FFC81E 0 20%, transparent 56%), radial-gradient(circle at 72% 66%, #13C7C0 0 20%, transparent 56%)",
  },
];

interface ColorChoiceSheetProps {
  open: boolean;
  onChoose: (count: ColorCount) => void;
  onClose: () => void;
}

/** Asks how many colours the reading should show, before the photo is taken or picked. */
export function ColorChoiceSheet({ open, onChoose, onClose }: ColorChoiceSheetProps) {
  return (
    <div className={`absolute inset-0 z-30 ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="How many colors"
        className={`absolute inset-x-0 bottom-0 rounded-t-[30px] border-t border-white/10 bg-[linear-gradient(160deg,rgba(14,20,62,0.95),rgba(30,14,48,0.95)_55%,rgba(46,12,34,0.97))] px-6 pb-[calc(var(--safe-bottom)+28px)] pt-3 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-white/25" />
        <p className="mt-6 text-center text-[10px] font-light italic tracking-[0.3em] text-white/55">
          BEFORE YOUR PHOTO
        </p>
        <h2 className="mt-2 text-center text-[15px] italic tracking-[0.22em]">HOW MANY COLORS?</h2>

        <div className="mt-7 grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => (
            <button
              key={option.count}
              type="button"
              onClick={() => onChoose(option.count)}
              className="flex flex-col items-center rounded-3xl border border-white/15 bg-white/[0.04] px-3 pb-5 pt-6 transition hover:border-white/35 active:scale-[0.97] active:bg-white/10"
            >
              <span className="size-20 rounded-full blur-[5px]" style={{ background: option.orb }} />
              <span className="mt-4 text-[11px] italic tracking-[0.24em]">{option.title}</span>
              <span className="mt-1.5 text-[11px] font-light text-white/55">{option.note}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
