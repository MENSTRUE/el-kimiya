type BrandMarkProps = {
  compact?: boolean;
  inverted?: boolean;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
};

export function BrandMark({
  compact = false,
  inverted = false,
  size = "md",
  showTagline = false,
  className = "",
}: BrandMarkProps) {
  const source = inverted
    ? "/brand/el-kimiya-approved-logo-white.svg"
    : "/brand/el-kimiya-approved-logo.svg";

  return (
    <span
      className={`brand-lockup brand-lockup-${size} ${compact ? "brand-lockup-compact" : ""} ${className}`}
    >
      <img className="brand-asset" src={source} alt="" aria-hidden="true" draggable={false} />
      {!compact && (
        <span className="brand-wordmark">
          <strong>El-Kīmiyā</strong>
          {showTagline ? (
            <small>Understand Chemistry. Anywhere.</small>
          ) : (
            <small lang="ar">الكيمياء</small>
          )}
        </span>
      )}
    </span>
  );
}
