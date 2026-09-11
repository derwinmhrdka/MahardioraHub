import styles from "./StoreMark.module.css";

export const BRAND_LOGO_SRC = "/brand/mahardiora-hub.png";
export const BRAND_LOGO_ALT = "Mahardiora-Hub";

type StoreMarkProps = {
  className?: string;
  /** Soft float animation (login / splash). */
  animated?: boolean;
  size?: number;
  /** Show full logo including wordmark (default). */
  full?: boolean;
};

/** Brand mark — Mahardiora-Hub character logo. */
export function StoreMark({
  className,
  animated = false,
  size = 72,
  full = true,
}: StoreMarkProps) {
  const height = full ? Math.round(size * 1.15) : size;

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
