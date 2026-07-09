import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

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

export const metadata: Metadata = {
  title: "Admin Panel - All Property Link",
  description: "Administration panel for All Property Link platform",
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
      <body className="h-full bg-background text-foreground font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
