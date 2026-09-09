import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { getSettings } from "@/lib/settings";
import styles from "./login.module.css";

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();

  if (session?.user?.role === "admin") {
    redirect("/admin/products");
  }
  if (session?.user) {
    redirect("/");
  }

  let siteName = "MahardioraHub";
  try {
    siteName = (await getSettings()).siteName;
  } catch {
    // fallback
  }

  const next =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/";

  return (
    <main className={styles.wrap}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.orbit} aria-hidden />
      <div className={styles.orbitSlow} aria-hidden />

      <div className={styles.stage}>
        <div className={styles.mark} aria-hidden>
          <span className={styles.awning} />
          <span className={styles.shop}>
            <span className={styles.door} />
          </span>
        </div>

        <p className={styles.brand}>{siteName}</p>

        <GoogleLoginButton next={next} />

        {params.error ? <p className={styles.error} aria-label="Gagal" /> : null}
      </div>
    </main>
  );
}
