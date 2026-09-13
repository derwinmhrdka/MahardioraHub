"use client";

import { useEffect, useState } from "react";
import { BRAND_LOGO_SRC } from "@/components/layout/StoreMark";
import styles from "./SplashScreen.module.css";

type SplashScreenProps = {
  siteName: string;
};

export function SplashScreen({ siteName }: SplashScreenProps) {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const outTimer = window.setTimeout(() => setPhase("out"), 1100);
    const doneTimer = window.setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = prev;
    }, 1650);

    return () => {
      window.clearTimeout(outTimer);
      window.clearTimeout(doneTimer);
      document.body.style.overflow = prev;
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`${styles.splash} ${phase === "out" ? styles.out : ""}`}
      aria-hidden={phase === "out"}
      role="presentation"
    >
      <div className={`${styles.blob} ${styles.blobTl}`} aria-hidden />
      <div className={`${styles.blob} ${styles.blobTr}`} aria-hidden />
      <div className={`${styles.blob} ${styles.blobBl}`} aria-hidden />
      <div className={`${styles.blob} ${styles.blobBr}`} aria-hidden />

      <div className={styles.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={`${styles.logo} ${styles.mark}`}
          src={BRAND_LOGO_SRC}
          alt=""
          width={720}
          height={720}
          draggable={false}
        />
        <p className={styles.srOnly}>{siteName}</p>
      </div>
    </div>
  );
}
