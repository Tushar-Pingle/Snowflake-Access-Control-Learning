/** The Frostbyte Academy snowflake mark. */
export function Snowflake({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <defs>
        <linearGradient id="flake-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <g stroke="url(#flake-grad)" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <g id="flake-arm">
          <line x1="16" y1="3" x2="16" y2="29" />
          <line x1="16" y1="9" x2="12" y2="6" />
          <line x1="16" y1="9" x2="20" y2="6" />
          <line x1="16" y1="23" x2="12" y2="26" />
          <line x1="16" y1="23" x2="20" y2="26" />
        </g>
        <use href="#flake-arm" transform="rotate(60 16 16)" />
        <use href="#flake-arm" transform="rotate(120 16 16)" />
      </g>
      <circle cx="16" cy="16" r="2.3" fill="url(#flake-grad)" />
    </svg>
  )
}
