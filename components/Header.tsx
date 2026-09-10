import { auth } from "@/auth";
import { CartDrawer } from "@/components/CartDrawer";
import { UserMenu } from "@/components/UserMenu";
import { getCartCount, listCartItems } from "@/lib/cart";
import { productImages } from "@/lib/product-images";
import Link from "next/link";
import { Package, Recycle } from "lucide-react";
import styles from "./Header.module.css";

type HeaderProps = {
  siteName?: string;
  active?: "deals" | "secondhand";
};

export async function Header({ active = "secondhand" }: HeaderProps) {
  const subtitle = active === "secondhand" ? "Collection" : "My Picks";
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

  if (showCart && userId) {
    const [count, rows] = await Promise.all([
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
          href={active === "deals" ? "/" : "/secondhand"}
          className={styles.brand}
        >
          <span className={styles.brandName}>Mahardiora</span>
          <span className={styles.brandSub}>{subtitle}</span>
        </Link>
        <div className={styles.right}>
          <nav className={styles.nav} aria-label="Main">
            <Link
              href="/"
              aria-current={active === "deals" ? "page" : undefined}
              aria-label="My Picks"
              title="My Picks"
            >
              <Package size={12} strokeWidth={2.25} aria-hidden />
              <span>My Picks</span>
            </Link>
            <Link
              href="/secondhand"
              aria-current={active === "secondhand" ? "page" : undefined}
              aria-label="Collection"
              title="Collection"
            >
              <Recycle size={12} strokeWidth={2.25} aria-hidden />
              <span>Collection</span>
            </Link>
          </nav>
          {showCart ? (
            <CartDrawer
              count={cartCount}
              loggedIn={Boolean(userId)}
              items={cartItems}
            />
          ) : null}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
