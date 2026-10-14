import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter, variable, with the optical-size axis so display sizes tighten
// (PRD 10.5). Self-hosted by next/font with a metric-matched fallback.
const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-inter",
  adjustFontFallback: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KK Fit Hub · Co-curricular programmes for Kenyan schools",
    template: "%s · KK Fit Hub",
  },
  description:
    "Vetted, professional coaches for your school, with the whole programme managed. Starting with Kenpo Karate. Serving Nairobi and five more counties.",
  applicationName: "KK Fit Hub",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-KE" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
