import { CartDrawer } from "@/components/CartDrawer";
import { UserMenu } from "@/components/UserMenu";
import { BRAND_LOGO_ALT, BRAND_LOGO_SRC } from "@/components/StoreMark";
import { getCartCount, listCartItems } from "@/lib/cart";
import { resolveCartOwner } from "@/lib/cart-owner";
import { productImages } from "@/lib/product-images";
import { auth } from "@/auth";
import Link from "next/link";
import { Package, Recycle } from "lucide-react";
import styles from "./Header.module.css";

type HeaderProps = {
  siteName?: string;
  active?: "deals" | "secondhand";
};

export async function Header({ active = "secondhand" }: HeaderProps) {
  const showCart = active === "secondhand";
  const session = await auth();

  let cartCount = 0;
  let cartItems: Array<{
    productId: number;
    title: string;
    quantity: number;
    stock: number;
    price: number;
    discountPercent: number;
    imageUrl: string | null;
    selected: boolean;
  }> = [];

  if (showCart) {
    const owner = await resolveCartOwner();
    const [count, rows] = await Promise.all([
      getCartCount(owner.ownerKey),
      listCartItems(owner.ownerKey),
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
      selected: row.selected,
    }));
  }

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : null;

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
              aria-label="Collection"
              title="Collection"
            >
              <Recycle size={13} strokeWidth={2.25} aria-hidden />
              {collectionOn ? <span>Collection</span> : null}
            </Link>
            <Link
              href="/picks"
              className={picksOn ? styles.navOn : styles.navOff}
              aria-current={picksOn ? "page" : undefined}
              aria-label="My Picks"
              title="My Picks"
            >
              <Package size={13} strokeWidth={2.25} aria-hidden />
              {picksOn ? <span>My Picks</span> : null}
            </Link>
          </nav>
          {showCart ? <CartDrawer count={cartCount} items={cartItems} /> : null}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
