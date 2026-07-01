type LectraLogoProps = {
  className?: string;
  compact?: boolean;
};

export function LectraLogo({ className, compact = false }: LectraLogoProps) {
  const width = compact ? 102 : 128;
  const height = compact ? 28 : 34;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 320 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lectra"
      role="img"
    >
      <defs>
        <linearGradient id="lectraLogoFill" x1="28" y1="10" x2="280" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2B5BFF" />
          <stop offset="1" stopColor="#0F4CFF" />
        </linearGradient>
      </defs>
      <text
        x="8"
        y="62"
        fill="url(#lectraLogoFill)"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="70"
        fontWeight="700"
        letterSpacing="-4"
      >
        Lectra
      </text>
    </svg>
  );
}