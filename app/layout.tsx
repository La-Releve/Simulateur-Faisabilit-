import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

// Police auto-hébergée au build par next/font : aucune requête vers Google au runtime.
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simulateur de Faisabilité — La Relève",
  description:
    "Simulez le plan de financement et la rentabilité d'une opération de marchand de biens. Calcul 100 % local, aucune donnée ne quitte votre appareil.",
  applicationName: "La Relève",
  appleWebApp: {
    capable: true,
    title: "La Relève",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
  other: { "apple-mobile-web-app-capable": "yes" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${openSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
