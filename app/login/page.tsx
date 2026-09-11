import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { DevLoginButtons } from "@/components/DevLoginButtons";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { StoreMark } from "@/components/StoreMark";
import styles from "./login.module.css";

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const isDev = process.env.NODE_ENV !== "production";

  if (session?.user?.role === "admin") {
    redirect("/admin/products");
  }
  if (session?.user) {
    redirect("/");
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

      <Link
        href={next}
        className={styles.back}
        aria-label="Kembali"
        title="Kembali"
      >
        <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
      </Link>

      <div className={styles.stage}>
        <StoreMark animated size={156} className={styles.mark} />

        {isDev ? (
          <DevLoginButtons next={next} />
        ) : (
          <GoogleLoginButton next={next} />
        )}

        {params.error ? <p className={styles.error} aria-label="Gagal" /> : null}
      </div>
    </main>
  );
}
