import Link from "next/link";
import { DinoPaw } from "@/components/DinoPaw";
import clsx from "clsx";
import { detectMarketplace } from "@/lib/marketplace";
import styles from "./DealCta.module.css";

type DealCtaProps = {
  productId: number;
  shopName?: string | null;
  affiliateLink?: string | null;
};

export function DealCta({
  productId,
  shopName,
  affiliateLink,
}: DealCtaProps) {
  const market = detectMarketplace({
    shopName,
    url: affiliateLink,
  });

  return (
    <Link
      href={`/go/${productId}`}
      className={clsx(styles.btn, styles[market])}
    >
      <DinoPaw size={14} />
      Ambil
    </Link>
  );
}
