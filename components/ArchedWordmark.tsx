import { BRAND_NAME } from "@/lib/brand";

interface ArchedWordmarkProps {
  className?: string;
  /** Rendered width in px; the height follows. */
  width?: number;
}

/** The brand name set on a gentle arch, like a halo over the head. */
export function ArchedWordmark({ className = "", width = 132 }: ArchedWordmarkProps) {
  return (
    <svg
      viewBox="0 0 200 64"
      width={width}
      height={(width * 64) / 200}
      className={className}
      role="img"
      aria-label={BRAND_NAME}
    >
      <defs>
        <path id="wordmark-arch" d="M 12 54 Q 100 6 188 54" />
      </defs>
      <text
        fill="currentColor"
        fontSize="22"
        fontStyle="italic"
        fontWeight="300"
        letterSpacing="9"
        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
      >
        <textPath href="#wordmark-arch" startOffset="50%" textAnchor="middle">
          {BRAND_NAME}
        </textPath>
      </text>
    </svg>
  );
}
