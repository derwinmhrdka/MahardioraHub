"use client";

import { useEffect, useState } from "react";
import { StoreMark } from "@/components/StoreMark";
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
    20|      document.body.style.overflow = prev;
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
      <div className={styles.hero}>
        <StoreMark animated size={96} className={styles.mark} />
        <p className={styles.brand}>{siteName}</p>
      </div>
    </div>
  );
}
