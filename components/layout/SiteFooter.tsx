import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer} aria-hidden>
      <div className={styles.hill} />
    </footer>
  );
}
