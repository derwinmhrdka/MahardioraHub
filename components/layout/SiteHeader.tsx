import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { BRAND_LOGO_ALT, BRAND_LOGO_SRC } from "@/components/layout/StoreMark";
import styles from "./Header.module.css";

type SiteHeaderProps = {
  siteName?: string;
  active?: "deals" | "secondhand";
};

/** Static header shell while auth/cart resolve (keeps public pages cacheable). */
function HeaderFallback({ active = "secondhand" }: { active?: "deals" | "secondhand" }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a
          href={active === "deals" ? "/picks" : "/"}
          className={styles.brand}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.brandLogo}
            src={BRAND_LOGO_SRC}
            alt={BRAND_LOGO_ALT}
            width={160}
            height={120}
            draggable={false}
          />
        </a>
        <div className={styles.right} aria-hidden />
      </div>
    </header>
  );
}

/**
 * Public-page header: Suspense isolates cookies/auth so the catalog shell
 * can use ISR / data cache instead of forcing the whole tree dynamic.
 */
export function SiteHeader(props: SiteHeaderProps) {
  return (
    <Suspense fallback={<HeaderFallback active={props.active} />}>
      <Header {...props} />
    </Suspense>
  );
}
