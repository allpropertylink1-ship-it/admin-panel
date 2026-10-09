import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { PWARegister } from "@/components/pwa/PWARegister";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#286255",
};

export const metadata: Metadata = {
  title: "Admin Panel - All Property Link",
  description: "Administration panel for All Property Link platform",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${sora.variable} ${dmSans.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="APL Admin" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
      </head>
      <body className="h-full bg-background text-foreground font-sans">
        <AuthProvider>{children}</AuthProvider>
        <PWARegister />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
