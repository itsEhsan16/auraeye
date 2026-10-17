import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Thin icon-only button for the top bar. */
export function IconButton({
  label,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`-m-2 grid size-11 place-items-center text-white/90 transition active:scale-90 active:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TopBar({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 mt-[var(--safe-top)] flex h-14 shrink-0 items-center justify-between px-6">
      {children}
    </div>
  );
}

/** The navy → plum strip under the photo. Capped in height; any spare space stays black below it. */
export function BottomPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[var(--safe-bottom)]">
      <div className="panel-gradient relative flex max-h-[200px] min-h-[112px] flex-1 items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/** Outlined round button with an italic caption, as on the result card. */
export function CircleAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-3 transition active:scale-95"
    >
      <span className="grid size-[54px] place-items-center rounded-full border border-white/35 text-white/90 transition group-hover:border-white/60 group-active:bg-white/10">
        {icon}
      </span>
      <span className="text-[10px] font-light italic tracking-[0.22em] text-white/80">{label}</span>
    </button>
  );
}
