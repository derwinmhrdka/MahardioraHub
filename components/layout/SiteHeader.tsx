import Link from "next/link";
import { Suspense } from "react";
import { Package, Recycle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BRAND_LOGO_ALT, BRAND_LOGO_SRC } from "@/components/layout/StoreMark";
import styles from "./Header.module.css";

type SiteHeaderProps = {
  siteName?: string;
  active?: "deals" | "secondhand";
};

/** Static chrome matching Header — avoids empty-right flash if Suspense ever retries. */
function HeaderFallback({
  active = "secondhand",
}: {
  active?: "deals" | "secondhand";
}) {
  const collectionOn = active === "secondhand";
  const picksOn = active === "deals";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
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
        </Link>
        <div className={styles.right}>
          <nav className={styles.nav} aria-label="Main">
            <Link
              href="/"
              className={collectionOn ? styles.navOn : styles.navOff}
              aria-current={collectionOn ? "page" : undefined}
            >
              <Recycle size={13} strokeWidth={2.25} aria-hidden />
              <span>Collection</span>
            </Link>
            <Link
              href="/picks"
              className={picksOn ? styles.navOn : styles.navOff}
              aria-current={picksOn ? "page" : undefined}
            >
              <Package size={13} strokeWidth={2.25} aria-hidden />
              <span>My Picks</span>
            </Link>
          </nav>
          <span className={styles.fallbackSlot} aria-hidden />
          <span className={styles.fallbackSlot} aria-hidden />
        </div>
      </div>
    </header>
  );
}

/**
 * Public-page header: Suspense isolates cookies/auth so the catalog shell
 * can use ISR / data cache instead of forcing the whole tree dynamic.
 * Place in a layout (not the filter page) so filter navigations don't blink.
 */
export function SiteHeader(props: SiteHeaderProps) {
  return (
    <Suspense fallback={<HeaderFallback active={props.active} />}>
      <Header {...props} />
    </Suspense>
  );
}
