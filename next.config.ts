import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(
  /\/+$/,
  "",
);
const cloudflareBase = process.env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_BASE_URL?.trim().replace(
  /\/+$/,
  "",
);
const supabaseHosts = new Set<string>(["amgdygnlteoybdwfmltj.supabase.co"]);
const cloudflareHosts = new Set<string>([
  "pub-7cd204bd9725400e859104bba872fd54.r2.dev",
]);
try {
  if (supabaseUrl) {
    supabaseHosts.add(new URL(supabaseUrl).hostname);
  }
} catch {
  /* ignore */
}
try {
  if (cloudflareBase) {
    cloudflareHosts.add(new URL(cloudflareBase).hostname);
  }
} catch {
  /* ignore */
}

const remotePatterns = [
  ...Array.from(supabaseHosts).map((hostname) => ({
    protocol: "https" as const,
    hostname,
    pathname: "/storage/v1/object/public/**",
  })),
  ...Array.from(cloudflareHosts).map((hostname) => ({
    protocol: "https" as const,
    hostname,
    pathname: "/**",
  })),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
