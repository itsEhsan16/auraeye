export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute inset-x-0 bottom-[calc(var(--safe-bottom)+36px)] z-40 flex justify-center transition duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      {message && (
        <span className="rounded-full border border-white/15 bg-black/70 px-5 py-2.5 text-[10px] italic tracking-[0.22em] text-white/90 backdrop-blur-md">
          {message}
        </span>
      )}
    </div>
  );
}
