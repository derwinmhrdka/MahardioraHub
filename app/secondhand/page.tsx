import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    area?: string;
    category?: string;
    platform?: string;
  }>;
};

/** Legacy URL — Collection is now the site home. */
export default async function SecondhandRedirectPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const params = new URLSearchParams();
  if (query.area?.trim()) params.set("area", query.area.trim());
  if (query.category?.trim()) params.set("category", query.category.trim());
  if (query.platform?.trim()) params.set("platform", query.platform.trim());
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
