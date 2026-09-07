import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import styles from "./WhatsAppButton.module.css";

type WhatsAppButtonProps = {
  href: string;
  label?: string;
};

export function WhatsAppButton({
  href,
  label = "Chat WA",
}: WhatsAppButtonProps) {
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
