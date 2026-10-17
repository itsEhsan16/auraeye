import type { ReactNode } from "react";
import { BRAND_NAME } from "@/lib/brand";

/**
 * Full screen on phones. On desktop (wide screen + mouse) it becomes an
 * iPhone-style device with a status bar, dynamic island and home indicator.
 * See the .stage / .device rules in globals.css.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="stage">
      <div className="device">
        <div className="device-screen">
          {children}
          <div className="device-chrome pointer-events-none absolute inset-0 z-50">
            <div className="absolute inset-x-0 top-0 flex h-[44px] items-center justify-between px-[30px] pt-1 text-[14px] font-medium not-italic tracking-normal">
              <span>9:41</span>
              <span className="flex items-center gap-[5px]">
                <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true">
                  <rect x="0" y="7" width="3" height="4" rx="0.8" />
                  <rect x="4.5" y="5" width="3" height="6" rx="0.8" />
                  <rect x="9" y="2.5" width="3" height="8.5" rx="0.8" />
                  <rect x="13.5" y="0" width="3" height="11" rx="0.8" />
                </svg>
                <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden="true">
                  <path d="M7.5 2.3c2 0 3.9.8 5.3 2.1l1.1-1.1A9 9 0 0 0 7.5.7 9 9 0 0 0 1.1 3.3l1.1 1.1a7.5 7.5 0 0 1 5.3-2.1zm0 3.1c1.2 0 2.3.4 3.1 1.2l1.1-1.1a6 6 0 0 0-8.4 0l1.1 1.1c.8-.8 1.9-1.2 3.1-1.2zm0 3.1c-.5 0-.9.2-1.2.5l1.2 1.3 1.2-1.3c-.3-.3-.7-.5-1.2-.5z" />
                </svg>
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="21" height="11" rx="3.2" stroke="currentColor" opacity="0.4" />
                  <rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" />
                  <path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4z" fill="currentColor" opacity="0.5" />
                </svg>
              </span>
            </div>
            <div className="absolute left-1/2 top-[11px] h-[32px] w-[112px] -translate-x-1/2 rounded-full bg-black" />
            <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/90" />
          </div>
        </div>
      </div>
      <p className="stage-caption text-[10px] font-light italic tracking-[0.4em] text-white/35">
        {BRAND_NAME} · INTERACTIVE PROTOTYPE
      </p>
    </div>
  );
}
