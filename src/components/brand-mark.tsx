// The Klean All brand mark — a little scrub pad drawn honestly:
// a yellow sponge base with a bumpy green fibre layer on top, tilted like a
// pad resting on a sink. Pure SVG so it stays crisp at any size.
export function BrandMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.8}
      viewBox="0 0 80 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* soft shadow under the pad */}
      <ellipse cx="40" cy="56" rx="26" ry="4.5" fill="#0b2e1a" opacity="0.12" />

      <g transform="rotate(-7 40 32)">
        {/* yellow sponge base */}
        <rect x="12" y="30" width="56" height="20" rx="7" fill="#facc15" />
        {/* sponge shading + pores */}
        <rect x="12" y="42" width="56" height="8" rx="4" fill="#eab308" opacity="0.55" />
        <circle cx="24" cy="40" r="1.6" fill="#ca8a04" opacity="0.5" />
        <circle cx="37" cy="43" r="1.3" fill="#ca8a04" opacity="0.5" />
        <circle cx="52" cy="39" r="1.5" fill="#ca8a04" opacity="0.5" />
        <circle cx="61" cy="43" r="1.2" fill="#ca8a04" opacity="0.5" />

        {/* green scrub fibre — bumpy top edge */}
        <path
          d="M12 32
             V22
             q0 -6 6 -6
             q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0
             q6 0 6 6
             V32
             Z"
          fill="#16a34a"
        />
        {/* fibre texture */}
        <path d="M18 24 l6 3 M30 22 l6 3 M44 23 l6 3 M56 22 l5 3" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 28 l5 2 M38 27 l5 2 M52 28 l5 2" stroke="#0b2e1a" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
        {/* highlight */}
        <path d="M16 20 q2 -3 6 -3" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

        {/* a few soap bubbles */}
        <circle cx="66" cy="14" r="3" stroke="#16a34a" strokeWidth="1.5" fill="white" opacity="0.9" />
        <circle cx="72" cy="8" r="2" stroke="#16a34a" strokeWidth="1.2" fill="white" opacity="0.7" />
      </g>
    </svg>
  );
}
