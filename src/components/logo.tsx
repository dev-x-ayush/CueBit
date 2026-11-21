/** CueBit mark: a bookmark ribbon with a play cue, the "bit" you jump back to. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="cb-g" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FDB98A" />
          <stop offset="0.5" stopColor="#FF8A57" />
          <stop offset="1" stopColor="#FF6B35" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#cb-g)" />
      <path d="M13 9.5h14a1.5 1.5 0 0 1 1.5 1.5v19.5l-8.5-5.4-8.5 5.4V11A1.5 1.5 0 0 1 13 9.5Z" fill="#2A140A" />
      <path d="M18 14.3v6.4l5.4-3.2Z" fill="#FDB98A" />
    </svg>
  );
}
