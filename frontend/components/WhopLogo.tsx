type Props = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

export function WhopLogo({ size = 22, showWordmark = true, className, wordmarkClassName }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Whop"
      >
        <path
          d="M2 9 L10 24 L14 17 L10 9 Z"
          fill="#ff5c1f"
        />
        <path
          d="M12 9 L20 24 L24 17 L20 9 Z"
          fill="#ff5c1f"
          opacity="0.85"
        />
      </svg>
      {showWordmark && (
        <span className={`font-bold tracking-tight ${wordmarkClassName ?? ""}`}>Whop</span>
      )}
    </div>
  );
}
