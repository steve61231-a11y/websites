import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "THE PROD · E-commerce Product Photography with AI", template: "%s · THE PROD" },
  description:
    "Become an e-commerce product photographer in the fastest timeframe possible. A 7-day course by Product Photography Kenya.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-dvh">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
