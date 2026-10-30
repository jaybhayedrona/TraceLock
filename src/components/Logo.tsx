interface LogoProps {
  className?: string;
  size?: number;
  textColor?: string;
  showText?: boolean;
}

export function Logo({
  className = '',
  size = 36,
  textColor = 'text-[#172033]',
  showText = true,
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* TraceLock Enterprise Logo: Deep Indigo #243B6B Base, Professional Blue #4776D0 Shield, Pure White Cryptographic Invariants */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        {/* Deep Indigo Rounded Base */}
        <rect width="48" height="48" rx="10" fill="#243B6B" />

        {/* Document Silhouette */}
        <path
          d="M13 11C13 9.89543 13.8954 9 15 9H27L34 16V37C34 38.1046 33.1046 39 32 39H15C13.8954 39 13 38.1046 13 37V11Z"
          fill="#FFFFFF"
          fillOpacity="0.12"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />

        {/* Document Fold */}
        <path d="M27 9V16H34" stroke="#FFFFFF" strokeWidth="1.8" strokeLinejoin="round" />

        {/* Shield Integrity Symbol in Professional Blue */}
        <path
          d="M24 19L31.5 22V27.5C31.5 32 28.5 35 24 36.5C19.5 35 16.5 32 16.5 27.5V22L24 19Z"
          fill="#4776D0"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Verification Checkmark */}
        <path
          d="M20.5 27.5L22.8 29.8L27.5 24.8"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Enterprise Cryptographic Key Dot */}
        <circle cx="37" cy="11" r="2.5" fill="#4776D0" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className={`text-lg font-bold tracking-tight leading-none ${textColor}`}>
            TraceLock
          </span>
          <span className="text-[10px] tracking-wider text-[#64748B] font-semibold uppercase mt-0.5">
            Enterprise Security
          </span>
        </div>
      )}
    </div>
  );
}
