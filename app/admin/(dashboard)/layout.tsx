import { AdminNav } from "@/components/AdminNav";
import { getSettings } from "@/lib/settings";
import styles from "./admin.module.css";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <div className={styles.shell}>
      <AdminNav siteName={settings.siteName} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
