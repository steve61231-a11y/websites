import type { NextConfig } from "next";

/**
 * Security headers (PRD 14.6). The CSP allows only the site, Supabase,
 * Turnstile and the analytics domain. Pages are static, so inline scripts
 * use 'unsafe-inline' rather than per-request nonces (which would make every
 * page dynamic); nothing user-supplied is ever rendered as script.
 */
const isDev = process.env.NODE_ENV === "development";
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const analyticsSrc = process.env.NEXT_PUBLIC_ANALYTICS_SRC ?? "https://plausible.io/js/script.tagged-events.js";
const analyticsOrigin = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN ? new URL(analyticsSrc).origin : "";
const httpsSite = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
const turnstile = "https://challenges.cloudflare.com";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${turnstile} ${analyticsOrigin}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${supabase}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase} ${analyticsOrigin} ${turnstile}`,
  `frame-src ${turnstile}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  httpsSite ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ")
  .replace(/\s{2,}/g, " ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Device motion only for the site itself (hero tilt); nothing else.
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(self), gyroscope=(self), magnetometer=(self), camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 960, 1280, 1920],
    imageSizes: [96, 256, 384],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
