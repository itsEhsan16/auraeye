import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 5l14 14M19 5L5 19" />
    </Icon>
  );
}

export function RetakeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19 3.5v4h-4" />
    </Icon>
  );
}

/** Eye inside a triangle, as on the READING button. */
export function ReadingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5L21.5 20h-19z" />
      <path d="M6.6 14.6c1.5-1.7 3.3-2.6 5.4-2.6s3.9.9 5.4 2.6c-1.5 1.7-3.3 2.6-5.4 2.6s-3.9-.9-5.4-2.6z" />
      <circle cx="12" cy="14.6" r="1.4" />
    </Icon>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11M8 7.5l4-4 4 4" />
      <path d="M5.5 12.5v7h13v-7" />
    </Icon>
  );
}

export function FlipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 10a7.5 7.5 0 0 1 13.4-3.1M19.5 14a7.5 7.5 0 0 1-13.4 3.1" />
      <path d="M18.5 3.5v3.7h-3.7M5.5 20.5v-3.7h3.7" />
    </Icon>
  );
}

export function GalleryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M4 17.5l5-4.5 3.5 3 3-2.5 4.5 4" />
    </Icon>
  );
}
