"use client";

import { Shield, UserRound } from "lucide-react";
import { signInDevAction } from "@/app/login/actions";
import styles from "./DevLoginButtons.module.css";

type DevLoginButtonsProps = {
  next?: string;
};

export function DevLoginButtons({ next = "/" }: DevLoginButtonsProps) {
  return (
    <div className={styles.row}>
      <form action={signInDevAction}>
        <input type="hidden" name="role" value="visitor" />
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className={styles.btn}
          aria-label="Visitor"
          title="Visitor"
        >
          <UserRound size={22} strokeWidth={2.25} aria-hidden />
        </button>
      </form>
      <form action={signInDevAction}>
        <input type="hidden" name="role" value="admin" />
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className={`${styles.btn} ${styles.admin}`}
          aria-label="Admin"
          title="Admin"
        >
          <Shield size={22} strokeWidth={2.25} aria-hidden />
        </button>
      </form>
    </div>
  );
}
