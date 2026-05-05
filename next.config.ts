import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(
  /\/+$/,
  "",
);
const supabaseHosts = new Set<string>(["amgdygnlteoybdwfmltj.supabase.co"]);
try {
  if (supabaseUrl) {
    supabaseHosts.add(new URL(supabaseUrl).hostname);
  }
} catch {
  /* ignore */
}

const remotePatterns = Array.from(supabaseHosts).map((hostname) => ({
  protocol: "https" as const,
  hostname,
  pathname: "/storage/v1/object/public/**",
}));

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
