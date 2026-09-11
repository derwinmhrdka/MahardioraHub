import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
      <ExternalLink size={13} strokeWidth={2} aria-hidden />
      Ambil Produk
    </Link>
  );
}
