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

const nextConfig: NextConfig = {
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
