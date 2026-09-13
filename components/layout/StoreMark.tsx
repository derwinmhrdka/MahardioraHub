import styles from "./StoreMark.module.css";

export const BRAND_LOGO_SRC = "/brand/mahardiora-hub.png";
export const BRAND_LOGO_ALT = "Mahardiora-Hub";

type StoreMarkProps = {
  className?: string;
  /** Soft float animation (login / splash). */
  animated?: boolean;
  size?: number;
};

/** Brand mark — Mahardiora character logo. */
export function StoreMark({
  className,
  animated = false,
  size = 72,
}: StoreMarkProps) {
  // New logo aspect ≈ 651×637
  const height = Math.round(size * 0.98);

  return (
    <span
      className={`${styles.root} ${animated ? styles.animated : ""} ${className ?? ""}`}
      style={{ width: size, height }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.img}
        src={BRAND_LOGO_SRC}
        alt=""
        width={size}
        height={height}
        draggable={false}
      />
    </span>
  );
}
