import { redirect } from "next/navigation";

/** Old password login removed — Google auth lives at /login. */
export default function AdminIndexPage() {
  redirect("/login?next=/admin/products");
}
