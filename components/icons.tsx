import type { SVGProps } from "react";

/**
 * Small stroke-based icon set (Lucide-style paths) used across the marketing
 * site and the dashboard. Kept local so there is no extra runtime dependency.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const LogoMark = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" width={24} height={24} aria-hidden="true" {...props}>
    <path
      d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
      className="fill-accent/15 stroke-accent"
      strokeWidth={1.75}
      strokeLinejoin="round"
    />
    <path
      d="M8 14.5 11 9l2.5 4L16 10"
      className="stroke-accent"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GridIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </Base>
);

export const ChartIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 3v18h18" />
    <path d="m7 15 3-4 3 2 4-6" />
  </Base>
);

export const UsersIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Base>
);

export const WalletIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
    <path d="M21 12a2 2 0 0 0-2-2h-5a2 2 0 0 0 0 4h5a2 2 0 0 0 2-2Z" />
  </Base>
);

export const BellIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Base>
);

export const SettingsIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const SearchIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Base>
);

export const MenuIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Base>
);

export const CloseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Base>
);

export const SunIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);

export const MoonIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Base>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </Base>
);

export const CheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Base>
);

export const TrendUpIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
    <path d="M16 7h6v6" />
  </Base>
);

export const TrendDownIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M22 17 13.5 8.5 8.5 13.5 2 7" />
    <path d="M16 17h6v-6" />
  </Base>
);

export const SparkIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </Base>
);

export const ShieldIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
);

export const PlugIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 22v-5" />
    <path d="M9 8V2M15 8V2" />
    <path d="M18 8H6v4a6 6 0 0 0 12 0V8Z" />
  </Base>
);

export const HomeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </Base>
);

export const BuildingIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17" />
    <path d="M15 8h3a1 1 0 0 1 1 1v12" />
    <path d="M3 21h18" />
    <path d="M8 7h.01M11 7h.01M8 11h.01M11 11h.01M8 15h.01M11 15h.01" />
  </Base>
);

export const MapPinIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Base>
);

export const KeyIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
    <path d="m21 2-9.6 9.6" />
    <circle cx="7.5" cy="15.5" r="5.5" />
  </Base>
);

export const TagIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </Base>
);

export const BedIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
    <path d="M2 16h20" />
    <path d="M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M12 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
  </Base>
);

export const BathIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z" />
    <path d="M6 20l-1 2M18 20l1 2M8 6h.01" />
  </Base>
);

export const RulerIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M16 3 21 8 8 21 3 16 16 3Z" />
    <path d="m9 8 1.5 1.5M12 5l1.5 1.5M6 11l1.5 1.5M11 16l1.5 1.5M8 13l1.5 1.5" />
  </Base>
);

export const CarIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M5 13 6.6 8.2A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.2L19 13" />
    <path d="M4 13h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
    <path d="M7 16h.01M17 16h.01" />
  </Base>
);

export const SlidersIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h6M14 18h6" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="8" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </Base>
);

export const HeartIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7 7-7Z" />
  </Base>
);

export const MessageCircleIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  </Base>
);

export const GoogleIcon = (props: IconProps) => (
  <svg viewBox="0 0 48 48" width={20} height={20} aria-hidden="true" {...props}>
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c11.045 0 20-8.955 20-20 0-1.341-.138-2.65-.389-3.917Z"
    />
    <path
      fill="#FF3D00"
      d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691Z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44Z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z"
    />
  </svg>
);
