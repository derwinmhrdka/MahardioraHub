import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();
    return {
      title: {
        default: settings.siteName,
        template: `%s · ${settings.siteName}`,
      },
      description: "Curated deals and secondhand items",
    };
  } catch {
    return {
      title: "MahardioraHub",
      description: "Curated deals and secondhand items",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
