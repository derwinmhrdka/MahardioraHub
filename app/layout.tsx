import type { Metadata, Viewport } from "next";
import { Caveat, Nunito } from "next/font/google";
import { SplashScreen } from "@/components/SplashScreen";
import { getSettings, siteOrigin } from "@/lib/settings";
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
  const origin = siteOrigin();
  try {
    const settings = await getSettings();
    const description = `${settings.siteName} — deals & secondhand`;
    return {
      metadataBase: new URL(origin),
      title: {
        default: settings.siteName,
        template: `%s · ${settings.siteName}`,
      },
      description,
      applicationName: settings.siteName,
      icons: {
        icon: [{ url: "/icon-store.svg", type: "image/svg+xml" }],
        apple: [{ url: "/apple-icon" }],
      },
      openGraph: {
        type: "website",
        locale: "id_ID",
        url: origin,
        siteName: settings.siteName,
        title: settings.siteName,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title: settings.siteName,
        description,
      },
    };
  } catch {
    return {
      metadataBase: new URL(origin),
      title: "MahardioraHub",
      description: "Deals & secondhand",
      icons: {
        icon: [{ url: "/icon-store.svg", type: "image/svg+xml" }],
      },
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
    <html lang="id" className={`${caveat.variable} ${nunito.variable}`}>
      <body>
        <SplashScreen siteName={siteName} />
        {children}
      </body>
    </html>
  );
}
