import { cn } from "@/lib/utils";

interface OpLogoIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export function OpLogoIcon({ className, size = 32, ...props }: OpLogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      className={cn("shrink-0 transition-transform duration-300 group-hover:scale-105", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="opIconGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE8B3" />
          <stop offset="35%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#AA8022" />
          <stop offset="100%" stopColor="#6F5012" />
        </linearGradient>
        <linearGradient id="opIconShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#222630" />
          <stop offset="50%" stopColor="#13151A" />
          <stop offset="100%" stopColor="#08090C" />
        </linearGradient>
        <linearGradient id="opIconSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#B0B6C3" />
        </linearGradient>
        <filter id="opIconShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Hexagonal automotive crest shield */}
      <path
        d="M32 3 L55 12 C55 35 45 53 32 61 C19 53 9 35 9 12 Z"
        fill="url(#opIconShieldGrad)"
        stroke="url(#opIconGoldGrad)"
        strokeWidth="2.8"
        strokeLinejoin="round"
        filter="url(#opIconShadow)"
      />

      {/* Inner precision rim */}
      <path
        d="M32 7.5 L50.5 15 C50.5 33.5 42 48.5 32 55.5 C22 48.5 13.5 33.5 13.5 15 Z"
        fill="none"
        stroke="url(#opIconGoldGrad)"
        strokeWidth="1"
        strokeOpacity="0.45"
      />

      {/* The 'O' ring in silver/chrome */}
      <path
        d="M26 19 C18.82 19 13 24.37 13 31 C13 37.63 18.82 43 26 43 C29 43 31.7 42 33.8 40.2 L33.8 34.6 C31.8 36.2 29 37.2 26 37.2 C21.8 37.2 18.5 34.4 18.5 31 C18.5 27.6 21.8 24.8 26 24.8 C29 24.8 31.8 25.8 33.8 27.4 L33.8 21.8 C31.7 20 29 19 26 19 Z"
        fill="url(#opIconSilverGrad)"
      />

      {/* The 'P' stem and aerodynamic loop in gleaming gold */}
      <path
        d="M31 18 L41 18 C46.5 18 51 22 51 27.5 C51 33 46.5 37 41 37 L36.5 37 L36.5 44 L31 44 Z M36.5 23.5 L36.5 31.5 L40.5 31.5 C43.2 31.5 45.5 29.7 45.5 27.5 C45.5 25.3 43.2 23.5 40.5 23.5 Z"
        fill="url(#opIconGoldGrad)"
      />

      {/* Dynamic gold speed-pip accent */}
      <circle cx="32" cy="11.5" r="2" fill="url(#opIconGoldGrad)" />
    </svg>
  );
}
