export default function PhotoKeeperMascot({ size = 52, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Photo Keeper Mascot"
    >
      <defs>
        <linearGradient id="folderGradient" x1="12" y1="12" x2="60" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="0.5" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <filter id="badgeShadow" x="2" y="2" width="28" height="28" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="rgba(0,0,0,0.18)" />
        </filter>
        <filter id="mascotShadow" x="6" y="8" width="60" height="58" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="rgba(2,132,199,0.22)" />
        </filter>
      </defs>

      {/* Main folder body */}
      <g filter="url(#mascotShadow)">
        {/* Back folder tab */}
        <path
          d="M16 18C16 15.79 17.79 14 20 14H32L36 18H52C54.21 18 56 19.79 56 22V24H16V18Z"
          fill="#0284c7"
          opacity="0.85"
        />
        {/* Main body rect */}
        <rect
          x="14"
          y="20"
          width="44"
          height="40"
          rx="8"
          fill="url(#folderGradient)"
        />
      </g>

      {/* Eyes */}
      <circle cx="28" cy="38" r="2.8" fill="#0f172a" />
      <circle cx="44" cy="38" r="2.8" fill="#0f172a" />
      {/* Eye highlights */}
      <circle cx="29" cy="37" r="0.9" fill="#ffffff" />
      <circle cx="45" cy="37" r="0.9" fill="#ffffff" />

      {/* Cute smile */}
      <path
        d="M32 44.5C33.5 47 38.5 47 40 44.5"
        stroke="#0f172a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Rosy cheeks */}
      <ellipse cx="23" cy="42" rx="2.5" ry="1.5" fill="#f43f5e" opacity="0.4" />
      <ellipse cx="49" cy="42" rx="2.5" ry="1.5" fill="#f43f5e" opacity="0.4" />

      {/* Plus badge on top-left */}
      <g filter="url(#badgeShadow)">
        <circle cx="16" cy="16" r="10" fill="#f59e0b" />
        <circle cx="16" cy="16" r="8.5" fill="#fbbf24" />
        {/* White plus */}
        <path
          d="M16 11.5V20.5M11.5 16H20.5"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
