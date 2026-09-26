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

// URL publique du site : nécessaire pour que l'image Open Graph soit référencée en absolu
// (aperçus de lien dans Messages, WhatsApp, LinkedIn…). Évaluée au build.
// Ordre : NEXT_PUBLIC_SITE_URL si défini, sinon le domaine de production fourni par
// l'hébergeur (VERCEL_PROJECT_PRODUCTION_URL sur Vercel), sinon localhost.
function siteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    "http://localhost:3000";
  // Tolère une valeur saisie sans protocole (« simulateur-lareleve.vercel.app »)
  return new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "Simulateur de Faisabilité ⎜ La Relève",
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
  // URL canonique (og:url) : utilisée par Facebook / LinkedIn pour identifier la page, quel que
  // soit le code de simulation placé après le # dans le lien partagé.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    locale: "fr_FR",
    siteName: "La Relève",
    title: "Simulateur de Faisabilité ⎜ La Relève",
    description: "Plan de financement, apport nécessaire et prix de revente d'une opération de marchand de biens.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simulateur de Faisabilité ⎜ La Relève",
    description: "Plan de financement, apport nécessaire et prix de revente d'une opération de marchand de biens.",
  },
  formatDetection: { telephone: false },
  other: { "apple-mobile-web-app-capable": "yes" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  colorScheme: "dark light",
};

// Pose data-theme avant le premier rendu : préférence enregistrée, sinon apparence système.
const THEME_SCRIPT = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem("theme")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.setAttribute("data-theme",t)})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" data-theme="dark" className={`${openSans.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
