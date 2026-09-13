import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/** Keeps header mounted across My Picks filter navigations. */
export default function PicksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="section-deals">
      <SiteHeader active="deals" />
      {children}
      <SiteFooter />
    </div>
  );
}
