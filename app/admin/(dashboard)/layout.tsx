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

  return (
    <div className={styles.shell}>
      <AdminNav
        siteName={settings.siteName}
        userImage={session?.user?.image}
        userName={session?.user?.name || session?.user?.email}
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
