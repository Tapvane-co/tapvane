import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

// Web addresses in share previews and the sitemap are built from this. Set NEXT_PUBLIC_SITE_URL to
// https://tapvane.com when the site goes live.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tapvane.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Tapvane | Tap. Share. Connect.",
  description:
    "NFC business cards and tags that open your digital profile with one tap.",
  applicationName: "Tapvane",
  alternates: { canonical: "./" },
  openGraph: {
    siteName: "Tapvane",
    type: "website",
    locale: "en_NG",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-NG"
      className={`${bodoni.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
