import { SiteHeader } from "@/components/SiteHeader";

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
    </div>
  );
}
