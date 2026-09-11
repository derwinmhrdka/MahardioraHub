import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import styles from "./WhatsAppButton.module.css";

type WhatsAppButtonProps = {
  href: string;
  label?: string;
  disabled?: boolean;
};

export function WhatsAppButton({
  href,
  label = "Chat WA",
  disabled = false,
}: WhatsAppButtonProps) {
  if (disabled) {
    return (
      <button type="button" className={styles.btn} disabled>
        <WhatsAppIcon size={16} />
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      className={styles.btn}
      target="_blank"
      rel="noopener noreferrer"
    >
      <WhatsAppIcon size={16} />
      {label}
    </a>
  );
}
