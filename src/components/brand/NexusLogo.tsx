import React, { useId } from 'react';

export interface NexusLogoProps {
  /**
   * 'full': Symbol + Wordmark + Subtitle
   * 'compact': Symbol + Wordmark
   * 'symbol': Symbol only
   * 'wordmark': Wordmark only
   */
  variant?: 'full' | 'compact' | 'symbol' | 'wordmark';
  /**
   * Size presets
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Optional custom subtitle or tagline
   */
  subtitle?: string;
  /**
   * Show or hide subtitle in full variant
   */
  showSubtitle?: boolean;
  /**
   * Additional custom CSS classes
   */
  className?: string;
  /**
   * Interactive hover glow effect
   */
  interactive?: boolean;
}

/**
 * Official NEXUS AI Brand Logo & Wordmark
 * Represents the Spatial Intelligence Workspace:
 * Geometric, futuristic nexus emblem with cyan/blue/purple gradient language.
 */
export const NexusLogo: React.FC<NexusLogoProps> = ({
  variant = 'compact',
  size = 'md',
  subtitle = 'SPATIAL INTELLIGENCE',
  showSubtitle = true,
  className = '',
  interactive = false,
}) => {
  const id = useId().replace(/:/g, '');
  const gradCyanBlue = `nexus-grad-cb-${id}`;
  const gradBluePurple = `nexus-grad-bp-${id}`;
  const gradFull = `nexus-grad-full-${id}`;
  const gradGlow = `nexus-grad-glow-${id}`;

  // Pixel sizing mapping
  const symbolSizes = {
    xs: { px: 18, text: 'text-xs', sub: 'text-[7px]' },
    sm: { px: 24, text: 'text-sm', sub: 'text-[8px]' },
    md: { px: 32, text: 'text-base', sub: 'text-[9px]' },
    lg: { px: 44, text: 'text-xl', sub: 'text-[11px]' },
    xl: { px: 64, text: 'text-3xl', sub: 'text-[13px]' },
  };

  const { px, text, sub } = symbolSizes[size];

  // Futuristic Geometric Nexus Symbol (Faceted Interlocking Diamond / Node Core)
  const renderSymbol = () => (
    <div
      className={`relative shrink-0 flex items-center justify-center ${
        interactive ? 'group-hover:scale-105 transition-transform duration-200' : ''
      }`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]"
      >
        <defs>
          <linearGradient id={gradCyanBlue} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="50%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id={gradBluePurple} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>

          <linearGradient id={gradFull} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="35%" stopColor="#38BDF8" />
            <stop offset="70%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>

          <linearGradient id={gradGlow} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.1" />
          </linearGradient>

          <filter id={`blur-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Ambient Backing Glow */}
        <circle cx="32" cy="32" r="22" fill={`url(#${gradGlow})`} filter={`url(#blur-${id})`} />

        {/* Outer Geometric Hexagonal / Faceted Shield Shield Outline */}
        <polygon
          points="32,4 56,18 56,46 32,60 8,46 8,18"
          stroke={`url(#${gradFull})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-70"
        />

        {/* Facet Node 1: Left Wing (Cyan to Blue) */}
        <polygon
          points="32,32 8,18 18,32 8,46"
          fill={`url(#${gradCyanBlue})`}
          className="opacity-85"
        />

        {/* Facet Node 2: Right Wing (Blue to Purple) */}
        <polygon
          points="32,32 56,18 46,32 56,46"
          fill={`url(#${gradBluePurple})`}
          className="opacity-90"
        />

        {/* Facet Node 3: Top Diamond Crown (Luminous Cyan) */}
        <polygon
          points="32,4 42,19 32,32 22,19"
          fill={`url(#${gradFull})`}
          className="opacity-95"
        />

        {/* Facet Node 4: Bottom Dimensional Anchor (Deep Indigo to Violet) */}
        <polygon
          points="32,32 42,45 32,60 22,45"
          fill={`url(#${gradBluePurple})`}
          className="opacity-90"
        />

        {/* Central Luminous Energy Core (Stylized X / Nexus Convergence) */}
        <path
          d="M23 23L41 41M41 23L23 41"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="opacity-95"
        />
        <circle cx="32" cy="32" r="3.5" fill="#FFFFFF" className="animate-subtle-pulse shadow-sm" />
        <circle cx="32" cy="32" r="1.5" fill="#00F2FE" />
      </svg>
    </div>
  );

  // Futuristic Wordmark
  const renderWordmark = () => (
    <div className="flex flex-col justify-center select-none leading-none">
      <div className="flex items-center gap-1.5">
        <span
          className={`font-black tracking-tight text-white ${text} font-sans uppercase`}
          style={{ letterSpacing: '0.08em' }}
        >
          NEXUS
        </span>
        <span
          className={`font-black ${text} font-sans bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 tracking-wider`}
          style={{ letterSpacing: '0.06em' }}
        >
          AI
        </span>
      </div>

      {(variant === 'full' || showSubtitle) && subtitle && (
        <span
          className={`font-mono ${sub} uppercase tracking-[0.22em] text-neutral-400 mt-1 font-medium`}
        >
          {subtitle}
        </span>
      )}
    </div>
  );

  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderSymbol()}
      </div>
    );
  }

  if (variant === 'wordmark') {
    return <div className={`inline-flex items-center ${className}`}>{renderWordmark()}</div>;
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 ${className} ${
        interactive ? 'group cursor-pointer' : ''
      }`}
    >
      {renderSymbol()}
      {renderWordmark()}
    </div>
  );
};
