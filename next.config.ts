import type { NextConfig } from "next";

const cloudflareBase = process.env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_BASE_URL?.trim().replace(
  /\/+$/,
  "",
);
const cloudflareHosts = new Set<string>([
  "pub-7cd204bd9725400e859104bba872fd54.r2.dev",
]);
try {
  if (cloudflareBase) {
    cloudflareHosts.add(new URL(cloudflareBase).hostname);
  }
} catch {
  /* ignore */
}

const remotePatterns = Array.from(cloudflareHosts).map((hostname) => ({
  protocol: "https" as const,
  hostname,
  pathname: "/**",
}));

const devAllowedOrigins =
  process.env.DEV_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? ["127.0.0.1", "localhost"];

// Basis-Sicherheitsheader für alle Antworten. Eine vollständige CSP (script-src)
// ist bewusst noch nicht gesetzt, weil GA4/Consent-Mode Inline-Skripte nutzen;
// frame-ancestors verhindert Clickjacking (u. a. auf /admin).
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  allowedDevOrigins: devAllowedOrigins,
  // exceljs ist eine Node-Bibliothek (nur in Route Handlern genutzt) und wird
  // nicht in das Server-Bundle gezogen, um Bundling-Probleme zu vermeiden.
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns,
    qualities: [75, 90],
  },
};

export default nextConfig;
