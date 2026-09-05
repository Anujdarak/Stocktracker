import React from 'react';

interface ProximityLogoProps {
  size?: number;
  className?: string;
  variant?: 'badge' | 'plain';
}

export const ProximityLogo: React.FC<ProximityLogoProps> = ({
  size = 22,
  className = '',
  variant = 'badge'
}) => {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:rotate-12"
    >
      <defs>
        <linearGradient id="prox-grad-main" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="prox-grad-accent" x1="6" y1="6" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <radialGradient id="prox-glow" cx="12" cy="12" r="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient center glow */}
      <circle cx="12" cy="12" r="5" fill="url(#prox-glow)" />

      {/* Outer Telemetry Horizon Track */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="url(#prox-grad-main)"
        strokeWidth="1.6"
        strokeDasharray="4 3"
        opacity="0.35"
      />

      {/* Dual Interlocking Convergence Arcs (Proximity Radar) */}
      <path
        d="M5.5 12A6.5 6.5 0 0 1 12 5.5"
        stroke="url(#prox-grad-main)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M12 18.5A6.5 6.5 0 0 0 18.5 12"
        stroke="url(#prox-grad-main)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Ascending Market Breakout Vector */}
      <path
        d="M7 17L17 7M17 7H11.5M17 7V12.5"
        stroke="url(#prox-grad-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Epicenter Proximity Beacon */}
      <circle cx="12" cy="12" r="2" fill="#34D399" />
      <circle cx="12" cy="12" r="0.75" fill="#FFFFFF" />
    </svg>
  );

  if (variant === 'plain') {
    return icon;
  }

  return (
    <div
      className={`relative p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 border border-emerald-500/30 group-hover:border-emerald-400/60 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-300 flex items-center justify-center ${className}`}
    >
      {/* Corner subtle micro-accent */}
      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-75 group-hover:animate-ping" />
      {icon}
    </div>
  );
};

export default ProximityLogo;
