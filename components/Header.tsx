import { auth } from "@/auth";
import { CartDrawer } from "@/components/CartDrawer";
import { StoreMark } from "@/components/StoreMark";
import { UserMenu } from "@/components/UserMenu";
import {
  buildCartWhatsAppMessage,
  getCartCount,
  listCartItems,
} from "@/lib/cart";
import { productImages } from "@/lib/product-images";
import { salePrice } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { Package, Recycle } from "lucide-react";
import styles from "./Header.module.css";

type HeaderProps = {
  siteName?: string;
  active?: "deals" | "secondhand";
};

export async function Header({ active = "deals" }: HeaderProps) {
  const subtitle = active === "secondhand" ? "Second Stuff" : "Product Hub";
  const showCart = active === "secondhand";
  const session = await auth();
  const userId = session?.user?.id;

  let cartCount = 0;
  let cartItems: Array<{
    productId: number;
    title: string;
    quantity: number;
    stock: number;
    price: number;
    discountPercent: number;
    imageUrl: string | null;
  }> = [];
  let checkoutHref: string | null = null;

  if (showCart && userId) {
    const [settings, count, rows] = await Promise.all([
      getSettings(),
      getCartCount(userId),
      listCartItems(userId),
    ]);
    cartCount = count;
    cartItems = rows.map((row) => ({
      productId: row.productId,
      title: row.product.title,
      quantity: row.quantity,
      stock: row.product.stock,
      price: row.product.price,
      discountPercent: row.product.discountPercent,
      imageUrl: productImages(row.product)[0] ?? null,
    }));
    checkoutHref =
      cartItems.length > 0
        ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
            buildCartWhatsAppMessage({
              template: settings.whatsappTemplate,
              items: cartItems.map((item) => ({
                title: item.title,
                quantity: item.quantity,
                id: item.productId,
                unitPrice: salePrice(item.price, item.discountPercent),
              })),
            })
          )}`
        : null;
  }

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : null;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          href={active === "secondhand" ? "/secondhand" : "/"}
          className={styles.brand}
        >
          <StoreMark size={34} className={styles.brandMark} />
          <span className={styles.brandText}>
            <span className={styles.brandName}>Mahardiora</span>
            <span className={styles.brandSub}>{subtitle}</span>
          </span>
        </Link>
        <div className={styles.right}>
          <nav className={styles.nav} aria-label="Main">
            <Link
              href="/"
              aria-current={active === "deals" ? "page" : undefined}
            >
              <Package size={12} strokeWidth={2} aria-hidden />
              Deals
            </Link>
            <Link
              href="/secondhand"
              aria-current={active === "secondhand" ? "page" : undefined}
            >
              <Recycle size={12} strokeWidth={2} aria-hidden />
              Used
            </Link>
          </nav>
          {showCart ? (
            <CartDrawer
              count={cartCount}
              loggedIn={Boolean(userId)}
              items={cartItems}
              checkoutHref={checkoutHref}
            />
          ) : null}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
