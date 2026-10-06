import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ChevronRight = (p: P) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>;
export const ChevronLeft = (p: P) => <Icon {...p}><path d="m15 6-6 6 6 6" /></Icon>;
export const ChevronDown = (p: P) => <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>;
export const Check = (p: P) => <Icon {...p}><path d="M5 12.5 10 17l9-10" /></Icon>;
export const Close = (p: P) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
export const Lock = (p: P) => (
  <Icon {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Icon>
);
export const Play = (p: P) => (
  <Icon {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></Icon>
);
export const Pause = (p: P) => (
  <Icon {...p} fill="currentColor" stroke="none"><rect x="6.5" y="5" width="4" height="14" rx="1.2" /><rect x="13.5" y="5" width="4" height="14" rx="1.2" /></Icon>
);
export const List = (p: P) => <Icon {...p}><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></Icon>;
export const Arrow = (p: P) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const Download = (p: P) => <Icon {...p}><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></Icon>;
export const Share = (p: P) => <Icon {...p}><path d="M12 15V4M8 8l4-4 4 4M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12" /></Icon>;
export const Home = (p: P) => <Icon {...p}><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></Icon>;
export const Award = (p: P) => (
  <Icon {...p}><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" /></Icon>
);
export const User = (p: P) => <Icon {...p}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></Icon>;
export const Doc = (p: P) => <Icon {...p}><path d="M7 3.5h6.5L18 8v12a.5.5 0 0 1-.5.5h-10A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z" /><path d="M13 3.5V8h5" /></Icon>;
export const Expand = (p: P) => <Icon {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></Icon>;
export const Shield = (p: P) => <Icon {...p}><path d="M12 3.5 5 6.5v5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9v-5z" /><path d="m9 12 2 2 4-4" /></Icon>;
export const Mail = (p: P) => <Icon {...p}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 6 7.5-6" /></Icon>;
export const Back10 = (p: P) => (
  <Icon {...p}><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" /><path d="M4.5 4.5V9H9" /><text x="12" y="15.5" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="600">10</text></Icon>
);
