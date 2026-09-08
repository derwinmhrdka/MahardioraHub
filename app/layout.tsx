import type { Metadata, Viewport } from "next";
import { Caveat, Nunito } from "next/font/google";
import { SplashScreen } from "@/components/SplashScreen";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteName = "MahardioraHub";
  try {
    const settings = await getSettings();
    siteName = settings.siteName;
  } catch {
    // keep fallback
  }

  return (
    <html lang="en" className={`${caveat.variable} ${nunito.variable}`}>
      <body>
        <SplashScreen siteName={siteName} />
        {children}
      </body>
    </html>
  );
}
