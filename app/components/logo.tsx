import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  onClick?: () => void;
}

export function Logo({
  className = '',
  size = 40,
  showText = true,
  onClick,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} onClick={onClick}>
      {/* Icon */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient
              id="logoGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient
              id="coinGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
          </defs>

          {/* Main circle */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="url(#logoGradient)"
            stroke="white"
            strokeWidth="2"
          />

          {/* Crowdfunding elements - multiple people/coins coming together */}
          {/* Central target/goal */}
          <circle cx="20" cy="20" r="6" fill="white" opacity="0.9" />
          <circle cx="20" cy="20" r="3" fill="url(#logoGradient)" />

          {/* Surrounding funding sources */}
          <circle
            cx="12"
            cy="12"
            r="2"
            fill="url(#coinGradient)"
            opacity="0.8"
          />
          <circle
            cx="28"
            cy="12"
            r="2"
            fill="url(#coinGradient)"
            opacity="0.8"
          />
          <circle
            cx="12"
            cy="28"
            r="2"
            fill="url(#coinGradient)"
            opacity="0.8"
          />
          <circle
            cx="28"
            cy="28"
            r="2"
            fill="url(#coinGradient)"
            opacity="0.8"
          />

          {/* Connection lines showing funds flowing to center */}
          <line
            x1="14"
            y1="14"
            x2="17"
            y2="17"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <line
            x1="26"
            y1="14"
            x2="23"
            y2="17"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <line
            x1="14"
            y1="26"
            x2="17"
            y2="23"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <line
            x1="26"
            y1="26"
            x2="23"
            y2="23"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            CrowdFund
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            SOLANA
          </span>
        </div>
      )}
    </div>
  );
}

// Icon-only version for favicons, etc.
export function LogoIcon({
  className = '',
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return <Logo className={className} size={size} showText={false} />;
}

// Minimal version for small spaces
export function LogoMini({ className = '' }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
    >
      <defs>
        <linearGradient id="miniGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      <circle cx="20" cy="20" r="18" fill="url(#miniGradient)" />
      <circle cx="20" cy="20" r="6" fill="white" opacity="0.9" />
      <circle cx="20" cy="20" r="3" fill="url(#miniGradient)" />

      <circle cx="12" cy="12" r="2" fill="#F59E0B" opacity="0.8" />
      <circle cx="28" cy="12" r="2" fill="#F59E0B" opacity="0.8" />
      <circle cx="12" cy="28" r="2" fill="#F59E0B" opacity="0.8" />
      <circle cx="28" cy="28" r="2" fill="#F59E0B" opacity="0.8" />
    </svg>
  );
}
