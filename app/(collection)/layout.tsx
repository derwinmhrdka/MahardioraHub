import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/** Keeps header mounted across catalog filter navigations (no Suspense blink). */
export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="section-secondhand">
      <SiteHeader active="secondhand" />
      {children}
      <SiteFooter />
    </div>
  );
}
