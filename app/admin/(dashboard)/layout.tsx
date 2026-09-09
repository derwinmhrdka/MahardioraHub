import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { auth } from "@/auth";
import { getSettings } from "@/lib/settings";
import styles from "./admin.module.css";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, session] = await Promise.all([getSettings(), auth()]);

  if (!session?.user) {
    redirect("/login?next=/admin/products");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className={styles.shell}>
      <AdminNav
        siteName={settings.siteName}
        userImage={session.user.image}
        userName={session.user.name || session.user.email}
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
