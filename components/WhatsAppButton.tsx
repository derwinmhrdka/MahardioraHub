import { MessageCircle } from "lucide-react";
import styles from "./WhatsAppButton.module.css";

type WhatsAppButtonProps = {
  href: string;
  label?: string;
};

export function WhatsAppButton({
  href,
  label = "Chat",
}: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      className={styles.btn}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle size={18} strokeWidth={2} aria-hidden />
      {label}
    </a>
  );
}
