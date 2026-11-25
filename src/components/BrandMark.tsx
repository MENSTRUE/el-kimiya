/* El-Kimiya approved marks; no CSS inversion or regenerated logo geometry. */
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
  const markNavy = "/brand/el-kimiya-approved-logo.svg";
  const markWhite = "/brand/el-kimiya-approved-logo-white.svg";
  return (
    <span className={`brand-lockup brand-lockup-${size} ${compact ? "brand-lockup-compact" : ""} ${inverted ? "brand-lockup-inverted" : "brand-lockup-auto"} ${className}`}>
      {inverted ? (
        <img className="brand-asset brand-asset-forced-white" src={markWhite} alt="" aria-hidden="true" draggable={false} />
      ) : (
        <>
          <img className="brand-asset brand-asset-navy" src={markNavy} alt="" aria-hidden="true" draggable={false} />
          <img className="brand-asset brand-asset-white" src={markWhite} alt="" aria-hidden="true" draggable={false} />
        </>
      )}
      {!compact && (
        <span className="brand-wordmark">
          <strong>El-Kīmiyā</strong>
          {showTagline ? <small>Understand Chemistry. Anywhere.</small> : <small lang="ar">الكيمياء</small>}
        </span>
      )}
    </span>
  );
}
