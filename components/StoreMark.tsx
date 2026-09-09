import styles from "./StoreMark.module.css";

type StoreMarkProps = {
  className?: string;
  /** Larger mark with soft motion (login / splash). */
  animated?: boolean;
  size?: number;
};

/** Hand-drawn shop mark — soft strokes, scalloped awning, slight lean. */
export function StoreMark({
  className,
  animated = false,
  size = 72,
}: StoreMarkProps) {
  return (
    <span
      className={`${styles.root} ${animated ? styles.animated : ""} ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        className={styles.svg}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* soft ground shadow */}
        <ellipse
          className={styles.shadow}
          cx="40"
          cy="72"
          rx="22"
          ry="3.5"
          fill="#111"
          opacity="0.12"
        />

        {/* store body — slight lean */}
        <path
          className={styles.body}
          d="M18.5 34.5c-.2 0-.5.2-.5.5v28c0 1.4 1 2.5 2.3 2.5h39.4c1.3 0 2.3-1.1 2.3-2.5V35c0-.3-.2-.5-.5-.5H18.5z"
          fill="#fff"
          stroke="#111"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />

        {/* scalloped awning */}
        <path
          className={styles.awning}
          d="M15 34.2c1.2-8.2 5.8-13.2 12.2-14.4 3.2-.6 6.4.2 9.3 1.4 2.4 1 4.5 1.2 6.8.2 2.8-1.2 5.8-2 9-1.4 6.2 1.2 10.6 6.4 11.8 14.2H15z"
          fill="#111"
        />
        <path
          className={styles.scallop}
          d="M15 34.2c3.2 3.8 6.2 3.8 9.2 0 3.2 3.8 6.2 3.8 9.3 0 3.1 3.8 6.1 3.8 9.2 0 3.2 3.8 6.2 3.8 9.3 0 3.1 3.8 6.2 3.8 9.2 0"
          stroke="#F7F3EB"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* left window */}
        <rect
          x="22"
          y="41"
          width="10"
          height="10"
          rx="2.2"
          fill="#F7F3EB"
          stroke="#111"
          strokeWidth="2"
        />
        <path d="M27 41v10M22 46h10" stroke="#111" strokeWidth="1.2" opacity="0.35" />

        {/* right window */}
        <rect
          x="48"
          y="41"
          width="10"
          height="10"
          rx="2.2"
          fill="#F7F3EB"
          stroke="#111"
          strokeWidth="2"
        />
        <path d="M53 41v10M48 46h10" stroke="#111" strokeWidth="1.2" opacity="0.35" />

        {/* arched door */}
        <path
          className={styles.door}
          d="M34 65.5V52.2c0-3.4 2.6-6.2 6-6.2s6 2.8 6 6.2v13.3"
          fill="#111"
        />
        <circle cx="43.2" cy="56.5" r="1.15" fill="#F7F3EB" />

        {/* hanging sign */}
        <g className={styles.signHang}>
          <path
            d="M58 28v6"
            stroke="#111"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <g className={styles.sign}>
            <rect
              x="53.5"
              y="33.5"
              width="11"
              height="8"
              rx="2"
              fill="#fff"
              stroke="#111"
              strokeWidth="1.8"
            />
            <circle cx="59" cy="37.5" r="1.6" fill="#111" />
          </g>
        </g>

        {/* soft spark dots */}
        <circle className={styles.spark} cx="12" cy="22" r="1.4" fill="#111" />
        <circle className={styles.sparkLate} cx="68" cy="18" r="1.1" fill="#111" />
        <path
          className={styles.spark}
          d="M70 48l1.2 2.4 2.4 1.2-2.4 1.2-1.2 2.4-1.2-2.4-2.4-1.2 2.4-1.2z"
          fill="#111"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}
